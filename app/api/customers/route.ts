import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import type { Customer, CreateCustomerDTO } from '@/lib/types';

// GET /api/customers - Get all customers
export async function GET() {
  try {
    const customers = await query<Customer>(
      'SELECT * FROM customers ORDER BY created_at DESC'
    );

    return NextResponse.json(customers, { status: 200 });
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}

// POST /api/customers - Create a new customer
export async function POST(request: NextRequest) {
  try {
    const body: CreateCustomerDTO = await request.json();
    const { name, email } = body;

    // Validation
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    if (!email || typeof email !== 'string' || !isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingCustomer = await query<Customer>(
      'SELECT id FROM customers WHERE email = ?',
      [email.toLowerCase()]
    );

    if (existingCustomer.length > 0) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 409 }
      );
    }

    // Insert new customer
    const result = await execute(
      'INSERT INTO customers (name, email) VALUES (?, ?)',
      [name.trim(), email.toLowerCase()]
    );

    // Fetch the created customer
    const newCustomer = await query<Customer>(
      'SELECT * FROM customers WHERE id = ?',
      [result.insertId]
    );

    return NextResponse.json(newCustomer[0], { status: 201 });
  } catch (error) {
    console.error('Error creating customer:', error);
    return NextResponse.json(
      { error: 'Failed to create customer' },
      { status: 500 }
    );
  }
}

// Helper function to validate email format
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
