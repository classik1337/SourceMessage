import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import jwt from 'jsonwebtoken';

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE
});

export async function GET(request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const token = authHeader.split(' ')[1];
  let userId;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    userId = decoded.id;
  } catch (err) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const chatId = searchParams.get('chatId');

  if (!chatId) {
    return NextResponse.json({ error: 'Chat ID is required' }, { status: 400 });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    const [rows] = await connection.execute(
      'SELECT role FROM messengerapp.group_chat_members WHERE chat_id = ? AND user_id = ?',
      [chatId, userId]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: 'User not in chat or chat not found' }, { status: 404 });
    }

    return NextResponse.json({ role: rows[0].role });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to get user role' }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
} 