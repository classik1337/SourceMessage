import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

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

const pool = mysql.createPool(dbConfig);

export async function POST(request) {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) {
    return NextResponse.json({ error: 'Authorization token is missing' }, { status: 401 });
  }
  let userId;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    userId = decoded.id;
  } catch (err) {
    return NextResponse.json({ error: 'Invalid or expired token', details: err.message }, { status: 401 });
  }
  let requestId;
  try {
    const body = await request.json();
    requestId = body.requestId;
    if (!requestId) {
      return NextResponse.json({ error: 'Request ID is required' }, { status: 400 });
    }
  } catch (err) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
  let connection;
  try {
    connection = await pool.getConnection();
    // Получаем заявку только по id и status
    const [rows] = await connection.execute('SELECT * FROM messengerapp.friends WHERE id = ? AND status = ?', [requestId, 'pending']);
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }
    const requestRow = rows[0];
    // Проверяем, что заявка адресована текущему пользователю
    if (requestRow.friend_id !== userId) {
      return NextResponse.json({ error: 'You are not allowed to accept this request' }, { status: 403 });
    }
    // Обновляем статус заявки
    await connection.execute('UPDATE messengerapp.friends SET status = ? WHERE id = ?', ['accepted', requestId]);
    // Создаём обратную запись
    await connection.execute('INSERT INTO messengerapp.friends (user_id, friend_id, status, created_at) VALUES (?, ?, ?, NOW())', [userId, requestRow.user_id, 'accepted']);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Accept request error:', err);
    return NextResponse.json({ error: 'Failed to accept request', details: err.message }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
} 