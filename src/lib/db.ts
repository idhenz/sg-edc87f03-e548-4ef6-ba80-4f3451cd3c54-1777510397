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

export async function query(sql: string, params?: any[]) {
  try {
    const connection = await pool.getConnection();
    
    try {
      const [rows] = await connection.execute(sql, params || []);
      return rows;
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error('[DB_QUERY_ERROR]', error.message);
    throw error;
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