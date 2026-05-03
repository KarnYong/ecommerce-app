import { NextRequest, NextResponse } from 'next/server';
import { query, transaction, OrderWithItems } from '@/lib/db';
import type { ApiResponse, ApiError, CreateOrderRequest } from '@/types';

// GET /api/orders - Get all orders with customer info
export async function GET() {
  try {
    const orders = await query<any[]>(`
      SELECT o.*,
        JSON_OBJECT('id', c.id, 'name', c.name, 'email', c.email) as customer
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      ORDER BY o.created_at DESC
    `);

    const ordersWithItems = await Promise.all(
      orders.map(async (order: any) => {
        const items = await query<any[]>(`
          SELECT oi.*, p.name as product_name, p.stock as product_stock
          FROM order_items oi
          LEFT JOIN products p ON oi.product_id = p.id
          WHERE oi.order_id = ?
        `, [order.id]);

        return {
          ...order,
          customer: order.customer || null,
          items: items.map(item => ({
            id: item.id,
            order_id: item.order_id,
            product_id: item.product_id,
            quantity: item.quantity,
            price: item.price,
            product: {
              id: item.product_id,
              name: item.product_name,
              stock: item.product_stock,
            },
          })),
        };
      })
    );

    return NextResponse.json<ApiResponse<OrderWithItems[]>>({
      success: true,
      data: ordersWithItems,
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json<ApiError>(
      { success: false, error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

// POST /api/orders - Create a new order with transaction
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customer_id, items } = body as CreateOrderRequest;

    if (!customer_id || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json<ApiError>(
        { success: false, error: 'Customer ID and items are required' },
        { status: 400 }
      );
    }

    // Validate items
    for (const item of items) {
      if (!item.product_id || !item.quantity || item.quantity < 1) {
        return NextResponse.json<ApiError>(
          { success: false, error: 'Invalid item data' },
          { status: 400 }
        );
      }
    }

    const result = await transaction(async (connection) => {
      // Check if customer exists
      const [customers] = await connection.query<any[]>(
        'SELECT * FROM customers WHERE id = ?',
        [customer_id]
      );

      if (customers.length === 0) {
        throw new Error('Customer not found');
      }

      // Get product details and check stock
      const productIds = items.map(item => item.product_id);
      const [products] = await connection.query<any[]>(
        `SELECT * FROM products WHERE id IN (${productIds.map(() => '?').join(',')})`,
        productIds
      );

      const productMap = new Map(products.map(p => [p.id, p]));

      // Validate all products exist and have sufficient stock
      for (const item of items) {
        const product = productMap.get(item.product_id);
        if (!product) {
          throw new Error(`Product with ID ${item.product_id} not found`);
        }
        if (product.stock < item.quantity) {
          throw new Error(`Insufficient stock for product: ${product.name}`);
        }
      }

      // Calculate total
      let total = 0;
      for (const item of items) {
        const product = productMap.get(item.product_id)!;
        total += parseFloat(product.price) * item.quantity;
      }

      // Create order
      const [orderResult] = await connection.query<any>(
        'INSERT INTO orders (customer_id, total, status) VALUES (?, ?, ?)',
        [customer_id, total, 'pending']
      );

      const orderId = orderResult.insertId;

      // Create order items and update stock
      for (const item of items) {
        const product = productMap.get(item.product_id)!;
        const price = product.price;

        await connection.query(
          'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
          [orderId, item.product_id, item.quantity, price]
        );

        await connection.query(
          'UPDATE products SET stock = stock - ? WHERE id = ?',
          [item.quantity, item.product_id]
        );
      }

      return orderId;
    });

    // Fetch the created order with items
    const orders = await query<any[]>(`
      SELECT o.*,
        JSON_OBJECT('id', c.id, 'name', c.name, 'email', c.email) as customer
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE o.id = ?
    `, [result]);

    const orderItems = await query<any[]>(`
      SELECT oi.*, p.name as product_name, p.stock as product_stock
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `, [result]);

    const order = orders[0];
    order.customer = order.customer || null;
    order.items = orderItems.map((item: any) => ({
      id: item.id,
      order_id: item.order_id,
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.price,
      product: {
        id: item.product_id,
        name: item.product_name,
        stock: item.product_stock,
      },
    }));

    return NextResponse.json<ApiResponse<OrderWithItems>>({
      success: true,
      data: order,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating order:', error);

    if (error.message === 'Customer not found') {
      return NextResponse.json<ApiError>(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      );
    }

    if (error.message?.includes('not found') || error.message?.includes('Insufficient stock')) {
      return NextResponse.json<ApiError>(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json<ApiError>(
      { success: false, error: 'Failed to create order' },
      { status: 500 }
    );
  }
}
