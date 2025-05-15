import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

// Конфигурация базы данных
const dbConfig = {
  host: process.env.MYSQL_HOST,
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

// Создание пула соединений
const pool = mysql.createPool(dbConfig);

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');

  if (!query) {
    return NextResponse.json(
      { error: 'Search query is required' },
      { status: 400 }
    );
  }

  let connection;
  try {
    connection = await pool.getConnection();
    
    // MySQL не поддерживает ILIKE, используем LIKE с COLLATE для регистронезависимого поиска
    const [rows] = await connection.execute(`
      SELECT 
        user_id,
        full_name,
        second_name,
        bio,
        location,
        website_url,
        avatar_url
      FROM user_profiles
      WHERE 
        second_name LIKE ? COLLATE utf8mb4_general_ci OR 
        full_name LIKE ? COLLATE utf8mb4_general_ci
      LIMIT 10
    `, [`%${query}%`, `%${query}%`]);

    return NextResponse.json(rows);
  } catch (err) {
    console.error('Database error:', err);
    return NextResponse.json(
      { error: 'Failed to search users', details: err.message },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}