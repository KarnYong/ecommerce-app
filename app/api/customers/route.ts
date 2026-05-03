import { NextRequest, NextResponse } from 'next/server';
import { query, Customer } from '@/lib/db';
import type { ApiResponse, ApiError } from '@/types';

// GET /api/customers - Get all customers
export async function GET() {
  try {
    const customers = await query<Customer[]>('SELECT * FROM customers ORDER BY created_at DESC');
    return NextResponse.json<ApiResponse<Customer[]>>({
      success: true,
      data: customers,
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json<ApiError>(
      { success: false, error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}

// POST /api/customers - Create a new customer
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email } = body;

    if (!name || !email) {
      return NextResponse.json<ApiError>(
        { success: false, error: 'Name and email are required' },
        { status: 400 }
      );
    }

    const result = await query<any>(
      'INSERT INTO customers (name, email) VALUES (?, ?)',
      [name, email]
    );

    const newCustomer = await query<Customer[]>(
      'SELECT * FROM customers WHERE id = ?',
      [(result as any).insertId]
    );

    return NextResponse.json<ApiResponse<Customer>>({
      success: true,
      data: newCustomer[0],
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating customer:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json<ApiError>(
        { success: false, error: 'Email already exists' },
        { status: 400 }
      );
    }

    return NextResponse.json<ApiError>(
      { success: false, error: 'Failed to create customer' },
      { status: 500 }
    );
  }
}
