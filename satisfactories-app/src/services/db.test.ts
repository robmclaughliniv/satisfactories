import { createRecord, getRecord, updateRecord, deleteRecord, query } from './db';

describe('CRUD operations', () => {
  const tableName = 'test_table';

  beforeAll(async () => {
    // Create a temporary test table for CRUD operations
    await query(
      `CREATE TEMP TABLE ${tableName} (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL
      )`
    );
  });

  afterAll(async () => {
    // Drop the temporary table after tests
    await query(`DROP TABLE IF EXISTS ${tableName}`);
  });

  let insertedRecord: any;

  test('createRecord inserts a record', async () => {
    insertedRecord = await createRecord(tableName, { name: 'Test Name' });
    expect(insertedRecord).toHaveProperty('id');
    expect(insertedRecord.name).toBe('Test Name');
  });

  test('getRecord retrieves the inserted record', async () => {
    const records = await getRecord(tableName, { id: insertedRecord.id });
    expect(records.length).toBeGreaterThan(0);
    expect(records[0].name).toBe('Test Name');
  });

  test('updateRecord updates the record', async () => {
    const updatedRecord = await updateRecord(tableName, { name: 'Updated Name' }, { id: insertedRecord.id });
    expect(updatedRecord.name).toBe('Updated Name');
  });

  test('deleteRecord deletes the record', async () => {
    const deletedRecord = await deleteRecord(tableName, { id: insertedRecord.id });
    expect(deletedRecord.id).toBe(insertedRecord.id);

    // Verify that the record is deleted
    const records = await getRecord(tableName, { id: insertedRecord.id });
    expect(records.length).toBe(0);
  });
});
