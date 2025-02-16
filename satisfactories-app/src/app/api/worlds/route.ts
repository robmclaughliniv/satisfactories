import { NextResponse } from 'next/server';
import db from '../../../services/db';

// GET: Retrieve all worlds
export async function GET() {
  try {
    const result = await db.query('SELECT * FROM worlds');
    return NextResponse.json({ worlds: result.rows });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch worlds.' }, { status: 500 });
  }
}

// POST: Create a new world
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Expecting the incoming JSON to have these fields:
    // name, biome, gameVersion, difficulty, coordinates, tags, powerStats, startDate
    const {
      name,
      biome,
      gameVersion,
      difficulty,
      coordinates,
      tags,
      powerStats,
      startDate,
    } = body;
    
    // For metadata, we combine biome and coordinates
    const metadata = JSON.stringify({ biome, coordinates });
    
    // Use a default user_id since authentication is not implemented yet.
    const user_id = 1;
    
    // Insert new world record
    const queryText = `INSERT INTO worlds (user_id, name, metadata, game_version, difficulty, tags, power_stats, start_date)
                       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                       RETURNING *`;
                       
    const values = [
      user_id,
      name,
      metadata,
      gameVersion,
      difficulty,
      tags,
      JSON.stringify(powerStats || {}),
      startDate,
    ];
    
    const result = await db.query(queryText, values);
    return NextResponse.json({ world: result.rows[0] });
  } catch (error) {
    console.error('Error creating world:', error);
    return NextResponse.json({ error: 'Failed to create world.' }, { status: 500 });
  }
}

// PUT: Update an existing world
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, updateData } = body;
    
    if (!id) {
      return NextResponse.json({ error: 'World id is required for update.' }, { status: 400 });
    }
    
    // Dynamically build SET clause for update
    let setClause = [];
    let values = [];
    let index = 1;
    
    for (const key in updateData) {
      setClause.push(`${key} = $${index}`);
      values.push(updateData[key]);
      index++;
    }
    // Append id as the last value
    values.push(id);
    
    const queryText = `UPDATE worlds SET ${setClause.join(', ')} WHERE id = $${index} RETURNING *`;
    const result = await db.query(queryText, values);
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'World not found.' }, { status: 404 });
    }
    return NextResponse.json({ world: result.rows[0] });
  } catch (error) {
    console.error('Error updating world:', error);
    return NextResponse.json({ error: 'Failed to update world.' }, { status: 500 });
  }
}

// DELETE: Delete an existing world
export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { id } = body;
    
    if (!id) {
      return NextResponse.json({ error: 'World id is required for deletion.' }, { status: 400 });
    }
    
    const queryText = `DELETE FROM worlds WHERE id = $1 RETURNING *`;
    const result = await db.query(queryText, [id]);
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'World not found.' }, { status: 404 });
    }
    return NextResponse.json({ message: 'World deleted successfully.' });
  } catch (error) {
    console.error('Error deleting world:', error);
    return NextResponse.json({ error: 'Failed to delete world.' }, { status: 500 });
  }
}
