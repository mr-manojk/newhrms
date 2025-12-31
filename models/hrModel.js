const pool = require('../config/db');

/**
 * Perform high-performance Bulk Upsert (Insert or Update on Duplicate Key)
 * Handles transactions and proper JSON serialization for MySQL.
 */
async function bulkUpsert(table, data, columns) {
  if (!data || data.length === 0) return;

  const escapedCols = columns.map(c => `\`${c}\``);
  const placeholders = columns.map(() => '?').join(',');
  
  // Create the update clause excluding keys and identifiers where appropriate
  const updateCols = columns.filter(col => col !== 'id' && col !== 'userId');
  const updateClause = updateCols.length > 0 
    ? updateCols.map(col => `\`${col}\` = VALUES(\`${col}\`)`).join(', ')
    : `\`id\` = \`id\``;

  const query = `INSERT INTO ${table} (${escapedCols.join(',')}) 
                 VALUES (${placeholders}) 
                 ON DUPLICATE KEY UPDATE ${updateClause}`;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    for (const item of data) {
      const values = columns.map(col => {
        let val = item[col];
        // Handle nested objects as JSON for MySQL
        if (val && typeof val === 'object' && !(val instanceof Date)) {
          return JSON.stringify(val);
        }
        // Handle empty values
        if (val === undefined || val === '' || val === 'null' || val === null) {
          return null;
        }
        return val;
      });
      await connection.query(query, values);
    }
    await connection.commit();
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

const hrModel = {
  findAll: async (table) => {
    const [rows] = await pool.query(`SELECT * FROM ${table}`);
    return rows;
  },
  
  bulkUpsert,

  findConfig: async () => {
    const [rows] = await pool.query('SELECT * FROM system_config LIMIT 1');
    return rows[0];
  },

  saveConfig: async (configData) => {
    // Basic single-row system_config handling
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
