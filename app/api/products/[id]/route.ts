import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import type { Product } from '@/lib/types';

// GET /api/products/[id] - Get a single product
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid product ID' },
        { status: 400 }
      );
    }

    const product = await query<Product>(
      'SELECT * FROM products WHERE id = ?',
      [id]
    );

    if (product.length === 0) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(product[0], { status: 200 });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

// DELETE /api/products/[id] - Delete a product
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid product ID' },
        { status: 400 }
      );
    }

    // Check if product exists
    const product = await query(
      'SELECT id FROM products WHERE id = ?',
      [id]
    );

    if (product.length === 0) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Check if product is in any orders
    const orderItems = await query(
      'SELECT id FROM order_items WHERE product_id = ?',
      [id]
    );

    if (orderItems.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete product that is in existing orders' },
        { status: 400 }
      );
    }

    // Delete product
    await execute('DELETE FROM products WHERE id = ?', [id]);

    return NextResponse.json(
      { message: 'Product deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}
