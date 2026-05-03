# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a full-stack Next.js 15 ecommerce application with:
- **Next.js 15** with App Router and React 19
- **TypeScript** with strict mode enabled
- **Tailwind CSS v4** for styling
- **MySQL** (via `mysql2` package) for database

## Development Commands

```bash
# Start development server with Turbopack
npm run dev

# Production build with Turbopack
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Database setup (run in MySQL)
mysql -u root -p -h localhost -P 3307 < schema.sql
mysql -u root -p -h localhost -P 3307 < seed.sql
```

## Project Structure

```
ecommerce-app/
├── schema.sql           # Database schema
├── seed.sql             # Sample data
├── .env.local           # Environment variables (database config)
├── lib/
│   └── db.ts           # Database connection pool and query helpers
├── types/
│   └── index.ts        # TypeScript interfaces for API types
└── app/
    ├── layout.tsx      # Root layout with navigation
    ├── page.tsx        # Dashboard
    ├── customers/      # Customer management page
    ├── products/       # Product management page
    ├── orders/         # Order management page
    └── api/            # API routes
        ├── customers/  # CRUD operations for customers
        ├── products/   # CRUD operations for products
        └── orders/     # CRUD operations for orders (with transactions)
```

## Database Connection

Database configuration is in `.env.local`:
- `DB_HOST` - Database host (default: localhost)
- `DB_PORT` - Database port (default: 3307)
- `DB_USER` - Database user (default: root)
- `DB_PASSWORD` - Database password (default: empty)
- `DB_NAME` - Database name (default: ecommerce)
- `DB_SSL` - Enable SSL for TiDB (default: false)

The database connection pool is in `lib/db.ts` with:
- `query<T>()` - Promise-based query helper
- `transaction<T>()` - Transaction helper for multi-step operations

## API Routes

All API routes return JSON with format: `{ success: boolean, data?: T, error?: string }`

- **Customers**: `/api/customers` and `/api/customers/[id]`
  - GET all, GET one, POST create, DELETE
- **Products**: `/api/products` and `/api/products/[id]`
  - GET all, GET one, POST create, DELETE
- **Orders**: `/api/orders` and `/api/orders/[id]`
  - GET all (with customer info), GET one (with items), POST create (with transaction), DELETE (restores stock)

Order creation uses database transactions to:
1. Validate customer exists
2. Check product stock availability
3. Create order and order items
4. Decrease product stock
5. Rollback on any error

## Frontend Pages

All pages use client-side fetching with loading/error states:
- **Dashboard** (`/`) - Overview with navigation cards
- **Customers** (`/customers`) - List, add, delete customers
- **Products** (`/products`) - List, add, delete products with stock indicators
- **Orders** (`/orders`) - List, create orders with customer/product selection, delete (restores stock)

## TypeScript Types

Types are defined in `types/index.ts`:
- `Customer`, `Product`, `Order`, `OrderItem`
- `CreateOrderRequest` - for order creation API
- `ApiResponse<T>` - standard API response wrapper
- `ApiError` - error response type

## Build System

This project uses **Turbopack** (enabled via `--turbopack` flag) for faster development and production builds.
