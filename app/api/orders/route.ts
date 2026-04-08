import { NextRequest, NextResponse } from 'next/server';
import { query, transaction } from '@/lib/db';
import type { OrderItem, CreateOrderDTO, OrderWithDetails } from '@/lib/types';

// Type for order query result with temporary customer fields
type OrderQueryResult = OrderWithDetails & {
  customer_id: number;
  customer_name: string;
  customer_email: string;
  customer_created_at: Date;
};

// Type for order item query result with temporary product fields
type OrderItemQueryResult = OrderItem & {
  product_id: number;
  product_name: string;
  product_price: number;
  product_stock: number;
  product_created_at: Date;
};

// GET /api/orders - Get all orders with customer and item details
export async function GET() {
  try {
    const orders = await query<OrderQueryResult>(
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

    // Fetch order items for each order and transform
    const result: OrderWithDetails[] = [];
    for (const rawOrder of orders) {
      const items = await query<OrderItemQueryResult>(
        `SELECT
          oi.*,
          p.id as product_id,
          p.name as product_name,
          p.price as product_price,
          p.stock as product_stock,
          p.created_at as product_created_at
         FROM order_items oi
         INNER JOIN products p ON oi.product_id = p.id
         WHERE oi.order_id = ?`,
        [rawOrder.id]
      );

      // Build clean order object
      const order: OrderWithDetails = {
        id: rawOrder.id,
        customer_id: rawOrder.customer_id,
        total: rawOrder.total,
        status: rawOrder.status,
        created_at: rawOrder.created_at,
        customer: {
          id: rawOrder.customer_id,
          name: rawOrder.customer_name,
          email: rawOrder.customer_email,
          created_at: rawOrder.customer_created_at
        },
        items: items.map(item => ({
          id: item.id,
          order_id: item.order_id,
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.price,
          product: {
            id: item.product_id,
            name: item.product_name,
            price: item.product_price,
            stock: item.product_stock,
            created_at: item.product_created_at
          }
        }))
      };

      result.push(order);
    }

    return NextResponse.json(result, { status: 200 });
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

      type ProductRow = { id: number; name: string; price: number; stock: number };
      const productMap = new Map((products as ProductRow[]).map(p => [p.id, p]));

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

      type InsertResult = { insertId: number; affectedRows: number };
      const orderId = (orderResult as InsertResult).insertId;

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
    const newOrder = await query<OrderQueryResult>(
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

    const orderItems = await query<OrderItemQueryResult>(
      `SELECT
        oi.*,
        p.id as product_id,
        p.name as product_name,
        p.price as product_price,
        p.stock as product_stock,
        p.created_at as product_created_at
       FROM order_items oi
       INNER JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = ?`,
      [result.orderId]
    );

    const rawOrder = newOrder[0];

    // Build clean order object
    const order: OrderWithDetails = {
      id: rawOrder.id,
      customer_id: rawOrder.customer_id,
      total: rawOrder.total,
      status: rawOrder.status,
      created_at: rawOrder.created_at,
      customer: {
        id: rawOrder.customer_id,
        name: rawOrder.customer_name,
        email: rawOrder.customer_email,
        created_at: rawOrder.customer_created_at
      },
      items: orderItems.map(item => ({
        id: item.id,
        order_id: item.order_id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
        product: {
          id: item.product_id,
          name: item.product_name,
          price: item.product_price,
          stock: item.product_stock,
          created_at: item.product_created_at
        }
      }))
    };

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error('Error creating order:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create order';

    // Determine if this is a validation error or a server error
    const isValidationError = errorMessage.includes('not found') ||
                              errorMessage.includes('Insufficient stock') ||
                              errorMessage.includes('required');

    return NextResponse.json(
      { error: errorMessage },
      { status: isValidationError ? 400 : 500 }
    );
  }
}
