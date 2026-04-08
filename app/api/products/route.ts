import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '../../lib/db';
import type { Product, CreateProductDTO } from '../../lib/types';

// GET /api/products - Get all products
export async function GET() {
  try {
    const products = await query<Product>(
      'SELECT * FROM products ORDER BY created_at DESC'
    );

    return NextResponse.json(products, { status: 200 });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

// POST /api/products - Create a new product
export async function POST(request: NextRequest) {
  try {
    const body: CreateProductDTO = await request.json();
    const { name, price, stock } = body;

    // Validation
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    if (price === undefined || typeof price !== 'number' || price < 0) {
      return NextResponse.json(
        { error: 'Valid price is required' },
        { status: 400 }
      );
    }

    if (stock === undefined || typeof stock !== 'number' || stock < 0) {
      return NextResponse.json(
        { error: 'Valid stock quantity is required' },
        { status: 400 }
      );
    }

    // Insert new product
    const result = await execute(
      'INSERT INTO products (name, price, stock) VALUES (?, ?, ?)',
      [name.trim(), price, stock]
    );

    // Fetch the created product
    const newProduct = await query<Product>(
      'SELECT * FROM products WHERE id = ?',
      [result.insertId]
    );

    return NextResponse.json(newProduct[0], { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}
