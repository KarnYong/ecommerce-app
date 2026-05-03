import { NextRequest, NextResponse } from 'next/server';
import { query, Product } from '@/lib/db';
import type { ApiResponse, ApiError } from '@/types';

// GET /api/products - Get all products
export async function GET() {
  try {
    const products = await query<Product[]>('SELECT * FROM products ORDER BY created_at DESC');
    return NextResponse.json<ApiResponse<Product[]>>({
      success: true,
      data: products,
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json<ApiError>(
      { success: false, error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

// POST /api/products - Create a new product
export async function POST(request: NextRequest) {
  try {
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
      'INSERT INTO products (name, price, stock) VALUES (?, ?, ?)',
      [name, price, stock]
    );

    const newProduct = await query<Product[]>(
      'SELECT * FROM products WHERE id = ?',
      [(result as any).insertId]
    );

    return NextResponse.json<ApiResponse<Product>>({
      success: true,
      data: newProduct[0],
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json<ApiError>(
      { success: false, error: 'Failed to create product' },
      { status: 500 }
    );
  }
}
