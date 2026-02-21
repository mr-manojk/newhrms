// @ts-nocheck
const pool = require('../config/db');

/**
 * Helper to convert ISO date strings to MySQL DATETIME format
 */
const formatForMySQL = (val) => {
  if (typeof val === 'string' && val.includes('T') && (val.endsWith('Z') || val.includes('+'))) {
    // Convert '2026-01-29T03:05:45.407Z' to '2026-01-29 03:05:45'
    return val.replace('T', ' ').split('.')[0].replace('Z', '');
  }
  return val;
};

/**
 * Perform high-performance Bulk Upsert (Insert or Update on Duplicate Key)
 * Handles transactions and proper JSON serialization for MySQL.
 */
async function bulkUpsert(table, data, columns) {
  if (!data || data.length === 0) return;

  const escapedCols = columns.map(c => `\`${c}\``);
  const placeholders = columns.map(() => '?').join(',');
  
  // Create the update clause
  const updateCols = columns.filter(col => col !== 'id' && col !== 'userId');
  const updateClause = updateCols.length > 0 
    ? updateCols.map(col => `\`${col}\` = VALUES(\`${col}\`)`).join(', ')
    : `\`id\` = \`id\``;

  const query = `INSERT INTO ${table} (${escapedCols.join(',')}) 
                 VALUES (${placeholders}) 
                 ON DUPLICATE KEY UPDATE ${updateClause}`;

  // Transactions require a dedicated connection, but we ensure prompt release
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    for (const item of data) {
      const values = columns.map(col => {
        let val = item[col];
        
        // 1. Handle Objects/Arrays as JSON strings
        if (val && typeof val === 'object' && !(val instanceof Date)) {
          return JSON.stringify(val);
        }
        
        // 2. Handle Null/Empty values
        if (val === undefined || val === '' || val === 'null' || val === null) {
          return null;
        }

        // 3. Handle ISO Datetime strings
        return formatForMySQL(val);
      });
      await connection.query(query, values);
    }
    await connection.commit();
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release(); // Return the connection to the pool immediately
  }
}

const hrModel = {
  /**
   * Safe Find All: Returns records or an empty array if table doesn't exist yet.
   */
  findAll: async (table) => {
    try {
      const [rows] = await pool.query(`SELECT * FROM ${table}`);
      return rows;
    } catch (err) {
      // If table is missing, return empty array to prevent app crash
      if (err.code === 'ER_NO_SUCH_TABLE') {
        console.warn(`⚠️ NexusHR Warning: Table '${table}' missing in database. Returning empty array.`);
        return [];
      }
      throw err;
    }
  },
  
  bulkUpsert,

  // Specific method for password reset by email
  updatePasswordByEmail: async (email, newPassword) => {
    const query = 'UPDATE users SET password = ? WHERE email = ?';
    const [result] = await pool.query(query, [newPassword, email]);
    return result;
  },

  // Uses shorthand pool.query
  findConfig: async () => {
    try {
      const [rows] = await pool.query('SELECT * FROM system_config LIMIT 1');
      return rows[0];
    } catch (err) {
      if (err.code === 'ER_NO_SUCH_TABLE') return null;
      throw err;
    }
  },

  // Uses shorthand pool.query
  saveConfig: async (configData) => {
    const cols = Object.keys(configData);
    const values = Object.values(configData);
    const placeholders = cols.map(() => '?').join(',');
    const updateClause = cols.map(c => `\`${c}\` = VALUES(\`${c}\`)`).join(', ');
    
    const query = `INSERT INTO system_config (${cols.map(c => `\`${c}\``).join(',')}) 
                   VALUES (${placeholders}) 
                   ON DUPLICATE KEY UPDATE ${updateClause}`;
    
    await pool.query(query, values);
  }
};

module.exports = hrModel;
