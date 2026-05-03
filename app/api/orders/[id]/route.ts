import { NextRequest, NextResponse } from 'next/server';
import { query, OrderWithItems } from '@/lib/db';
import type { ApiResponse, ApiError } from '@/types';

// GET /api/orders/[id] - Get a single order with items
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const orderId = parseInt(id);

    if (isNaN(orderId)) {
      return NextResponse.json<ApiError>(
        { success: false, error: 'Invalid order ID' },
        { status: 400 }
      );
    }

    const orders = await query<any[]>(`
      SELECT o.*,
        JSON_OBJECT('id', c.id, 'name', c.name, 'email', c.email) as customer
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE o.id = ?
    `, [orderId]);

    if (orders.length === 0) {
      return NextResponse.json<ApiError>(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    const orderItems = await query<any[]>(`
      SELECT oi.*, p.name as product_name, p.stock as product_stock
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `, [orderId]);

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
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json<ApiError>(
      { success: false, error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}

// PATCH /api/orders/[id] - Update order status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const orderId = parseInt(id);

    if (isNaN(orderId)) {
      return NextResponse.json<ApiError>(
        { success: false, error: 'Invalid order ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { status } = body;

    if (!status || !['pending', 'completed', 'cancelled'].includes(status)) {
      return NextResponse.json<ApiError>(
        { success: false, error: 'Valid status required (pending, completed, cancelled)' },
        { status: 400 }
      );
    }

    const result = await query<any>(
      'UPDATE orders SET status = ? WHERE id = ?',
      [status, orderId]
    );

    if ((result as any).affectedRows === 0) {
      return NextResponse.json<ApiError>(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    const orders = await query<any[]>(`
      SELECT o.*,
        JSON_OBJECT('id', c.id, 'name', c.name, 'email', c.email) as customer
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE o.id = ?
    `, [orderId]);

    const orderItems = await query<any[]>(`
      SELECT oi.*, p.name as product_name, p.stock as product_stock
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `, [orderId]);

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
    });
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json<ApiError>(
      { success: false, error: 'Failed to update order' },
      { status: 500 }
    );
  }
}

// DELETE /api/orders/[id] - Delete an order
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const orderId = parseInt(id);

    if (isNaN(orderId)) {
      return NextResponse.json<ApiError>(
        { success: false, error: 'Invalid order ID' },
        { status: 400 }
      );
    }

    // Get order items to restore stock before deletion
    const orderItems = await query<any[]>(
      'SELECT product_id, quantity FROM order_items WHERE order_id = ?',
      [orderId]
    );

    // Restore stock for each item
    for (const item of orderItems) {
      await query(
        'UPDATE products SET stock = stock + ? WHERE id = ?',
        [item.quantity, item.product_id]
      );
    }

    // Delete the order (cascade will delete order_items)
    const result = await query<any>(
      'DELETE FROM orders WHERE id = ?',
      [orderId]
    );

    if ((result as any).affectedRows === 0) {
      return NextResponse.json<ApiError>(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Order deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting order:', error);
    return NextResponse.json<ApiError>(
      { success: false, error: 'Failed to delete order' },
      { status: 500 }
    );
  }
}
