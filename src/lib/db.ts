import mysql from 'mysql2/promise'

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT || '3306'),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
})

export async function query<T = any>(sql: string, values?: any[]): Promise<T[]> {
  const [rows] = await pool.execute(sql, values)
  return rows as T[]
}

export default pool