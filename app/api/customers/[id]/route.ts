import { NextRequest, NextResponse } from 'next/server';
import { query, Customer } from '@/lib/db';
import type { ApiResponse, ApiError } from '@/types';

// GET /api/customers/[id] - Get a single customer
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const customerId = parseInt(id);

    if (isNaN(customerId)) {
      return NextResponse.json<ApiError>(
        { success: false, error: 'Invalid customer ID' },
        { status: 400 }
      );
    }

    const customers = await query<Customer[]>(
      'SELECT * FROM customers WHERE id = ?',
      [customerId]
    );

    if (customers.length === 0) {
      return NextResponse.json<ApiError>(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<Customer>>({
      success: true,
      data: customers[0],
    });
  } catch (error) {
    console.error('Error fetching customer:', error);
    return NextResponse.json<ApiError>(
      { success: false, error: 'Failed to fetch customer' },
      { status: 500 }
    );
  }
}

// PATCH /api/customers/[id] - Update a customer
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const customerId = parseInt(id);

    if (isNaN(customerId)) {
      return NextResponse.json<ApiError>(
        { success: false, error: 'Invalid customer ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, email } = body;

    if (!name || !email) {
      return NextResponse.json<ApiError>(
        { success: false, error: 'Name and email are required' },
        { status: 400 }
      );
    }

    const result = await query<any>(
      'UPDATE customers SET name = ?, email = ? WHERE id = ?',
      [name, email, customerId]
    );

    if ((result as any).affectedRows === 0) {
      return NextResponse.json<ApiError>(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      );
    }

    const customers = await query<Customer[]>(
      'SELECT * FROM customers WHERE id = ?',
      [customerId]
    );

    return NextResponse.json<ApiResponse<Customer>>({
      success: true,
      data: customers[0],
    });
  } catch (error: any) {
    console.error('Error updating customer:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json<ApiError>(
        { success: false, error: 'Email already exists' },
        { status: 400 }
      );
    }

    return NextResponse.json<ApiError>(
      { success: false, error: 'Failed to update customer' },
      { status: 500 }
    );
  }
}

// DELETE /api/customers/[id] - Delete a customer
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const customerId = parseInt(id);

    if (isNaN(customerId)) {
      return NextResponse.json<ApiError>(
        { success: false, error: 'Invalid customer ID' },
        { status: 400 }
      );
    }

    const result = await query<any>(
      'DELETE FROM customers WHERE id = ?',
      [customerId]
    );

    if ((result as any).affectedRows === 0) {
      return NextResponse.json<ApiError>(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Customer deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting customer:', error);
    return NextResponse.json<ApiError>(
      { success: false, error: 'Failed to delete customer' },
      { status: 500 }
    );
  }
}
