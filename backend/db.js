const oracledb = require('oracledb');

let pool = null;

async function initialize() {
  try {
    const walletDir = process.env.ORACLE_WALLET_DIR;
    const poolConfig = {
      user: process.env.ORACLE_USER,
      password: process.env.ORACLE_PASSWORD,
      connectString: process.env.ORACLE_DSN,
      poolMin: 2,
      poolMax: 10,
      poolIncrement: 1,
    };

    if (walletDir) {
      poolConfig.configDir = walletDir;
      poolConfig.walletLocation = walletDir;
      poolConfig.walletPassword = process.env.ORACLE_PASSWORD;
    }

    pool = await oracledb.createPool(poolConfig);
    console.log('Oracle connection pool created');
  } catch (err) {
    console.error('Failed to create Oracle pool:', err.message);
    throw err;
  }
}

async function getConnection() {
  if (!pool) await initialize();
  return pool.getConnection();
}

async function close() {
  if (pool) {
    await pool.close(0);
    console.log('Oracle pool closed');
  }
}

// Execute a query and return rows as objects (column names lowercased)
async function execute(sql, binds = {}, options = {}) {
  const conn = await getConnection();
  try {
    const result = await conn.execute(sql, binds, {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
      autoCommit: true,
      ...options,
    });
    return result;
  } finally {
    await conn.close();
  }
}

module.exports = { initialize, getConnection, close, execute };
