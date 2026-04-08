import { NextRequest, NextResponse } from 'next/server';
import { query, execute, transaction } from '@/lib/db';
import type { Order, OrderItem, CreateOrderDTO, OrderWithDetails } from '@/lib/types';

// GET /api/orders - Get all orders with customer and item details
export async function GET() {
  try {
    const orders = await query<OrderWithDetails>(
      `SELECT
        o.*,
        c.id as customer_id,
        c.name as customer_name,
        c.email as customer_email,
        c.created_at as customer_created_at
       FROM orders o
       INNER JOIN customers c ON o.customer_id = c.id
       ORDER BY o.created_at DESC`
    );

    // Fetch order items for each order
    for (const order of orders) {
      const items = await query<
        OrderItem & { product: { id: number; name: string } }
      >(
        `SELECT
          oi.*,
          p.id as product_id,
          p.name as product_name
         FROM order_items oi
         INNER JOIN products p ON oi.product_id = p.id
         WHERE oi.order_id = ?`,
        [order.id]
      );

      // Transform the result to match the expected structure
      order.items = items.map(item => ({
        id: item.id,
        order_id: item.order_id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
        product: {
          id: item.product_id,
          name: item.product_name
        }
      }));

      // Transform customer data
      order.customer = {
        id: order.customer_id as any,
        name: order.customer_name as any,
        email: order.customer_email as any,
        created_at: order.customer_created_at as any
      };

      // Clean up temporary properties
      delete (order as any).customer_name;
      delete (order as any).customer_email;
      delete (order as any).customer_created_at;
    }

    return NextResponse.json(orders, { status: 200 });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

// POST /api/orders - Create a new order
export async function POST(request: NextRequest) {
  try {
    const body: CreateOrderDTO = await request.json();
    const { customer_id, items } = body;

    // Validation
    if (!customer_id || typeof customer_id !== 'number') {
      return NextResponse.json(
        { error: 'Valid customer ID is required' },
        { status: 400 }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Order must contain at least one item' },
        { status: 400 }
      );
    }

    // Validate each item
    for (const item of items) {
      if (!item.product_id || typeof item.product_id !== 'number') {
        return NextResponse.json(
          { error: 'Valid product ID is required for each item' },
          { status: 400 }
        );
      }
      if (!item.quantity || typeof item.quantity !== 'number' || item.quantity < 1) {
        return NextResponse.json(
          { error: 'Valid quantity is required for each item' },
          { status: 400 }
        );
      }
    }

    // Check if customer exists
    const customer = await query(
      'SELECT id FROM customers WHERE id = ?',
      [customer_id]
    );

    if (customer.length === 0) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Use transaction to create order and update stock
    const result = await transaction(async (connection) => {
      // Fetch products and check stock
      const productIds = items.map(item => item.product_id);
      const placeholders = productIds.map(() => '?').join(',');
      const [products] = await connection.execute(
        `SELECT id, name, price, stock FROM products WHERE id IN (${placeholders})`,
        productIds
      );

      const productMap = new Map((products as any[]).map(p => [p.id, p]));

      // Validate all products exist and have sufficient stock
      for (const item of items) {
        const product = productMap.get(item.product_id);
        if (!product) {
          throw new Error(`Product with ID ${item.product_id} not found`);
        }
        if (product.stock < item.quantity) {
          throw new Error(
            `Insufficient stock for product "${product.name}". Available: ${product.stock}, Requested: ${item.quantity}`
          );
        }
      }

      // Calculate total
      let total = 0;
      const orderItemsData: Array<{ product_id: number; quantity: number; price: number }> = [];

      for (const item of items) {
        const product = productMap.get(item.product_id)!;
        const itemTotal = product.price * item.quantity;
        total += itemTotal;
        orderItemsData.push({
          product_id: item.product_id,
          quantity: item.quantity,
          price: product.price
        });
      }

      // Create order
      const [orderResult] = await connection.execute(
        'INSERT INTO orders (customer_id, total, status) VALUES (?, ?, ?)',
        [customer_id, total, 'pending']
      );

      const orderId = (orderResult as any).insertId;

      // Create order items and update stock
      for (const itemData of orderItemsData) {
        await connection.execute(
          'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
          [orderId, itemData.product_id, itemData.quantity, itemData.price]
        );

        // Update product stock
        await connection.execute(
          'UPDATE products SET stock = stock - ? WHERE id = ?',
          [itemData.quantity, itemData.product_id]
        );
      }

      return { orderId, total };
    });

    // Fetch the complete order with details
    const newOrder = await query<OrderWithDetails>(
      `SELECT
        o.*,
        c.id as customer_id,
        c.name as customer_name,
        c.email as customer_email,
        c.created_at as customer_created_at
       FROM orders o
       INNER JOIN customers c ON o.customer_id = c.id
       WHERE o.id = ?`,
      [result.orderId]
    );

    const orderItems = await query<
      OrderItem & { product: { id: number; name: string } }
    >(
      `SELECT
        oi.*,
        p.id as product_id,
        p.name as product_name
       FROM order_items oi
       INNER JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = ?`,
      [result.orderId]
    );

    const order = newOrder[0];
    order.items = orderItems.map(item => ({
      id: item.id,
      order_id: item.order_id,
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.price,
      product: {
        id: item.product_id,
        name: item.product_name
      }
    }));

    order.customer = {
      id: order.customer_id as any,
      name: order.customer_name as any,
      email: order.customer_email as any,
      created_at: order.customer_created_at as any
    };

    delete (order as any).customer_name;
    delete (order as any).customer_email;
    delete (order as any).customer_created_at;

    return NextResponse.json(order, { status: 201 });
  } catch (error: any) {
    console.error('Error creating order:', error);

    // Determine if this is a validation error or a server error
    const errorMessage = error?.message || 'Failed to create order';
    const isValidationError = errorMessage.includes('not found') ||
                              errorMessage.includes('Insufficient stock') ||
                              errorMessage.includes('required');

    return NextResponse.json(
      { error: errorMessage },
      { status: isValidationError ? 400 : 500 }
    );
  }
}
