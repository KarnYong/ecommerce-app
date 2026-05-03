import mysql from 'mysql2/promise';
import { OkPacket, RowDataPacket, ResultSetHeader } from 'mysql2';

interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  ssl?: boolean;
}

const config: DatabaseConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3307'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ecommerce',
  ssl: process.env.DB_SSL === 'true',
};

// Create connection pool
const pool = mysql.createPool({
  host: config.host,
  port: config.port,
  user: config.user,
  password: config.password,
  database: config.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ...(config.ssl && {
    ssl: {
      minVersion: 'TLSv1.2',
      rejectUnauthorized: true,
    },
  }),
});

// Type helpers for query results
export type QueryResult = RowDataPacket[] | RowDataPacket[][] | OkPacket | OkPacket[] | ResultSetHeader;

export interface Customer {
  id: number;
  name: string;
  email: string;
  created_at: Date;
}

export interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  created_at: Date;
}

export interface Order {
  id: number;
  customer_id: number;
  total: number;
  status: 'pending' | 'completed' | 'cancelled';
  created_at: Date;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  price: number;
  product?: Product;
}

export interface OrderWithItems extends Order {
  items: OrderItem[];
  customer?: Customer;
}

// Query helper function
export async function query<T = QueryResult>(
  sql: string,
  params?: any[]
): Promise<T> {
  const [results] = await pool.execute(sql, params);
  return results as T;
}

// Transaction helper
export async function transaction<T>(
  callback: (connection: mysql.PoolConnection) => Promise<T>
): Promise<T> {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export default pool;
