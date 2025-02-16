import { query } from "../src/services/db";

async function testDb() {
  try {
    const result = await query("SELECT 1 AS result;");
    console.log("Database test succeeded:", result.rows);
  } catch (error) {
    console.error("Database test failed:", error);
  } finally {
    process.exit();
  }
}

testDb();
