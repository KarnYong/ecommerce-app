import mysql from 'mysql2/promise';

// Database connection pool configuration
const poolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3307'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ecommerce',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl:
    process.env.DB_SSL === 'true'
      ? {
        minVersion: 'TLSv1.2',
        rejectUnauthorized: false,
      }
      : undefined,
};

// Create connection pool
const pool = mysql.createPool(poolConfig);

// Types for database query results
export type ResultSetHeader = {
  fieldCount: number;
  affectedRows: number;
  insertId: number;
  info: string;
  serverStatus: number;
  warningStatus: number;
};

export type RowDataPacket<T = any> = T & {
  [key: string]: any;
};

// Helper function to execute queries
export async function query<T = any>(
  sql: string,
  params?: any[]
): Promise<T[]> {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows as T[];
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

// Helper function to get a single row
export async function queryOne<T = any>(
  sql: string,
  params?: any[]
): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

// Helper function to execute insert/update/delete operations
export async function execute(
  sql: string,
  params?: any[]
): Promise<ResultSetHeader> {
  try {
    const [result] = await pool.execute(sql, params);
    return result as ResultSetHeader;
  } catch (error) {
    console.error('Database execute error:', error);
    throw error;
  }
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
