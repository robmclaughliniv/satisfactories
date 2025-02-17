import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Basic query function for convenience.
export const query = (text: string, params?: any[]) => {
  return pool.query(text, params);
};

/**
 * Create a new record in the specified table.
 * @param table The table name.
 * @param data An object containing column-value pairs.
 * @returns The inserted record.
 */
export async function createRecord(table: string, data: { [key: string]: any }): Promise<any> {
  try {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const columns = keys.join(', ');
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    const queryText = `INSERT INTO ${table} (${columns}) VALUES (${placeholders}) RETURNING *`;
    const result = await pool.query(queryText, values);
    return result.rows[0];
  } catch (error) {
    console.error("Error in createRecord:", error);
    throw error;
  }
}

/**
 * Retrieve records from the specified table matching given conditions.
 * @param table The table name.
 * @param conditions An object containing column-value pairs for the WHERE clause.
 * @returns An array of matching records.
 */
export async function getRecord(table: string, conditions: { [key: string]: any }): Promise<any> {
  try {
    const keys = Object.keys(conditions);
    const values = Object.values(conditions);
    const conditionStr = keys.map((key, i) => `${key} = $${i + 1}`).join(' AND ');
    const queryText = `SELECT * FROM ${table} WHERE ${conditionStr}`;
    const result = await pool.query(queryText, values);
    return result.rows;
  } catch (error) {
    console.error("Error in getRecord:", error);
    throw error;
  }
}

/**
 * Update records in the specified table.
 * @param table The table name.
 * @param data An object containing column-value pairs for the new data.
 * @param conditions An object containing column-value pairs for the WHERE clause.
 * @returns The updated record.
 */
export async function updateRecord(table: string, data: { [key: string]: any }, conditions: { [key: string]: any }): Promise<any> {
  try {
    const dataKeys = Object.keys(data);
    const dataValues = Object.values(data);
    const setStr = dataKeys.map((key, i) => `${key} = $${i + 1}`).join(', ');
    
    const conditionKeys = Object.keys(conditions);
    const conditionValues = Object.values(conditions);
    const conditionStr = conditionKeys.map((key, i) => `${key} = $${dataKeys.length + i + 1}`).join(' AND ');
    
    const queryText = `UPDATE ${table} SET ${setStr} WHERE ${conditionStr} RETURNING *`;
    const result = await pool.query(queryText, [...dataValues, ...conditionValues]);
    return result.rows[0];
  } catch (error) {
    console.error("Error in updateRecord:", error);
    throw error;
  }
}

/**
 * Delete records from the specified table.
 * @param table The table name.
 * @param conditions An object containing column-value pairs for the WHERE clause.
 * @returns The deleted record.
 */
export async function deleteRecord(table: string, conditions: { [key: string]: any }): Promise<any> {
  try {
    const keys = Object.keys(conditions);
    const values = Object.values(conditions);
    const conditionStr = keys.map((key, i) => `${key} = $${i + 1}`).join(' AND ');
    const queryText = `DELETE FROM ${table} WHERE ${conditionStr} RETURNING *`;
    const result = await pool.query(queryText, values);
    return result.rows[0];
  } catch (error) {
    console.error("Error in deleteRecord:", error);
    throw error;
  }
}
