import mysql from 'mysql2/promise'

// Create connection pool with serverless-friendly settings
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT || '3306'),
  waitForConnections: true,
  connectionLimit: 5, // Lower for serverless
  maxIdle: 2, // Max idle connections
  idleTimeout: 60000, // 60 seconds
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
})

export async function query<T = any>(sql: string, values?: any[]): Promise<T[]> {
  try {
    const [rows] = await pool.execute(sql, values)
    return rows as T[]
  } catch (error: any) {
    console.error('Database query error:', error.message)
    throw new Error(`Database error: ${error.message}`)
  }
}

export default pool