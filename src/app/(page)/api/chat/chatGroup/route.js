import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import jwt from 'jsonwebtoken';



const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export async function GET(request) {
  // Получаем токен из заголовков
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Authorization token is missing or invalid' },
      { status: 401 }
    );
  }

  const token = authHeader.split(' ')[1];
  let userId;

  try {
    // Верифицируем токен и получаем ID пользователя
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    userId = decoded.id; // Предполагаем, что в токене есть поле id
  } catch (err) {
    return NextResponse.json(
      { error: 'Invalid or expired token', details: err.message },
      { status: 401 }
    );
  }

  let connection;
  try {
    connection = await pool.getConnection();

    const [groups] = await connection.query(`
      SELECT 
        gc.id AS group_id,
        gc.name AS group_name,
        gc.created_at AS group_created,
        (
          SELECT content 
          FROM messengerapp.messages m 
          WHERE m.group_chat_id = gc.id 
          ORDER BY m.sent_at DESC 
          LIMIT 1
        ) AS last_message_content,
        (
          SELECT sent_at 
          FROM messengerapp.messages m 
          WHERE m.group_chat_id = gc.id 
          ORDER BY m.sent_at DESC 
          LIMIT 1
        ) AS last_message_time,
        (
          SELECT u.username 
          FROM messengerapp.messages m
          JOIN messengerapp.users u ON m.sender_id = u.id
          WHERE m.group_chat_id = gc.id 
          ORDER BY m.sent_at DESC 
          LIMIT 1
        ) AS last_message_sender,
        (
          SELECT is_read 
          FROM messengerapp.messages m 
          WHERE m.group_chat_id = gc.id 
          ORDER BY m.sent_at DESC 
          LIMIT 1
        ) AS last_message_read,
        COUNT(DISTINCT gcm.user_id) AS members_count
      FROM messengerapp.group_chats gc
      JOIN messengerapp.group_chat_members gcm ON gc.id = gcm.chat_id
      WHERE gcm.user_id = ?
      GROUP BY gc.id
      ORDER BY last_message_time DESC
    `, [userId]);

    return NextResponse.json(groups);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch groups', details: error.message },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}

export async function POST(request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Authorization token is missing or invalid' },
      { status: 401 }
    );
  }

  const token = authHeader.split(' ')[1];
  let userId;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    userId = decoded.id;
  } catch (err) {
    return NextResponse.json(
      { error: 'Invalid or expired token', details: err.message },
      { status: 401 }
    );
  }

  let connection;
  try {
    const body = await request.json();
    const { name, userIds } = body;
    if (!name || !Array.isArray(userIds) || userIds.length < 3) {
      return NextResponse.json(
        { error: 'Group name and at least 3 userIds are required' },
        { status: 400 }
      );
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    // 1. Создать запись в group_chats
    const [chatResult] = await connection.execute(
      'INSERT INTO messengerapp.group_chats (name, created_by, created_at) VALUES (?, ?, NOW())',
      [name, userId]
    );
    const chatId = chatResult.insertId;

    // 2. Добавить участников в group_chat_members
    const memberValues = userIds.map(uid => {
      const role = (uid === userId) ? "'creator'" : "'member'";
      return `(${chatId}, ${uid}, ${role}, NOW())`;
    }).join(',');
    
    await connection.query(
      `INSERT INTO messengerapp.group_chat_members (chat_id, user_id, role, joined_at) VALUES ${memberValues}`
    );

    await connection.commit();
    return NextResponse.json({ chatId, name });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error creating group chat:', error);
    return NextResponse.json(
      { error: 'Failed to create group chat', details: error.message },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}