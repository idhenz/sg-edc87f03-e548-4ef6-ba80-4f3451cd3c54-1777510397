import mysql from 'mysql2/promise'

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || '103.93.161.167',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'remote',
  password: process.env.DB_PASSWORD || 'Malang2026',
  database: process.env.DB_NAME || 'isp',
  waitForConnections: true,
  connectionLimit: 5,
  maxIdle: 2,
  idleTimeout: 60000,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  connectTimeout: 10000
}

console.log('[DB] Initializing pool with host:', dbConfig.host, 'port:', dbConfig.port, 'database:', dbConfig.database)

const pool = mysql.createPool(dbConfig)

export async function query<T = any>(sql: string, values?: any[]): Promise<T[]> {
  let connection
  try {
    console.log('[DB] Getting connection from pool...')
    connection = await pool.getConnection()
    console.log('[DB] Connection acquired, executing query:', sql.substring(0, 50))
    
    const [rows] = await connection.execute(sql, values)
    console.log('[DB] Query success, rows:', Array.isArray(rows) ? rows.length : 'N/A')
    
    return rows as T[]
  } catch (error: any) {
    console.error('[DB] Query error:', error.message)
    console.error('[DB] Error code:', error.code)
    console.error('[DB] SQL State:', error.sqlState)
    throw new Error(`Database error: ${error.message}`)
  } finally {
    if (connection) {
      console.log('[DB] Releasing connection')
      connection.release()
    }
  }
}

export async function getConnection() {
  try {
    console.log('[DB] Creating direct connection...')
    const connection = await mysql.createConnection(dbConfig)
    console.log('[DB] Direct connection created')
    return connection
  } catch (error: any) {
    console.error('[DB] Connection error:', error.message)
    console.error('[DB] Error code:', error.code)
    throw new Error(`Database connection error: ${error.message}`)
  }
}

export default pool