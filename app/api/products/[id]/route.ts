import { NextRequest, NextResponse } from 'next/server';
import { query, Product } from '@/lib/db';
import type { ApiResponse, ApiError } from '@/types';

// GET /api/products/[id] - Get a single product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = parseInt(id);

    if (isNaN(productId)) {
      return NextResponse.json<ApiError>(
        { success: false, error: 'Invalid product ID' },
        { status: 400 }
      );
    }

    const products = await query<Product[]>(
      'SELECT * FROM products WHERE id = ?',
      [productId]
    );

    if (products.length === 0) {
      return NextResponse.json<ApiError>(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<Product>>({
      success: true,
      data: products[0],
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json<ApiError>(
      { success: false, error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

// PATCH /api/products/[id] - Update a product
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = parseInt(id);

    if (isNaN(productId)) {
      return NextResponse.json<ApiError>(
        { success: false, error: 'Invalid product ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, price, stock } = body;

    if (!name || price === undefined || stock === undefined) {
      return NextResponse.json<ApiError>(
        { success: false, error: 'Name, price, and stock are required' },
        { status: 400 }
      );
    }

    if (price < 0 || stock < 0) {
      return NextResponse.json<ApiError>(
        { success: false, error: 'Price and stock must be non-negative' },
        { status: 400 }
      );
    }

    const result = await query<any>(
      'UPDATE products SET name = ?, price = ?, stock = ? WHERE id = ?',
      [name, price, stock, productId]
    );

    if ((result as any).affectedRows === 0) {
      return NextResponse.json<ApiError>(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    const products = await query<Product[]>(
      'SELECT * FROM products WHERE id = ?',
      [productId]
    );

    return NextResponse.json<ApiResponse<Product>>({
      success: true,
      data: products[0],
    });
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json<ApiError>(
      { success: false, error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

// DELETE /api/products/[id] - Delete a product
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = parseInt(id);

    if (isNaN(productId)) {
      return NextResponse.json<ApiError>(
        { success: false, error: 'Invalid product ID' },
        { status: 400 }
      );
    }

    const result = await query<any>(
      'DELETE FROM products WHERE id = ?',
      [productId]
    );

    if ((result as any).affectedRows === 0) {
      return NextResponse.json<ApiError>(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json<ApiError>(
      { success: false, error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}
