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

  // Новый функционал: если есть query-параметр 'members', возвращаем участников группы
  const { searchParams } = new URL(request.url);
  const membersChatId = searchParams.get('members');
  if (membersChatId) {
    let connection;
    try {
      connection = await pool.getConnection();
      const [members] = await connection.query(`
        SELECT gcm.user_id, gcm.role, gcm.joined_at, u.username, up.avatar_url, up.bio, up.location, up.full_name, up.second_name
        FROM messengerapp.group_chat_members gcm
        JOIN messengerapp.users u ON gcm.user_id = u.id
        LEFT JOIN messengerapp.user_profiles up ON u.id = up.user_id
        WHERE gcm.chat_id = ?
        ORDER BY gcm.role DESC, gcm.joined_at ASC
      `, [membersChatId]);
      return NextResponse.json({ members });
    } catch (error) {
      console.error('Database error (members):', error);
      return NextResponse.json(
        { error: 'Failed to fetch group members', details: error.message },
        { status: 500 }
      );
    } finally {
      if (connection) connection.release();
    }
  }

  // Новый функционал: если есть query-параметр 'mutualFriends', возвращаем общих друзей
  const mutualUserId = searchParams.get('mutualFriends');
  if (mutualUserId) {
    let connection;
    try {
      connection = await pool.getConnection();
      // Получаем id текущего пользователя
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const myId = decoded.id;
      // Общие друзья: accepted и в одну, и в другую сторону
      const [rows] = await connection.query(`
        SELECT u.id, u.login, up.avatar_url, up.full_name, up.second_name
        FROM messengerapp.users u
        LEFT JOIN messengerapp.user_profiles up ON u.id = up.user_id
        WHERE u.id IN (
          SELECT friend_id FROM messengerapp.friends WHERE user_id = ? AND status = 'accepted'
          INTERSECT
          SELECT friend_id FROM messengerapp.friends WHERE user_id = ? AND status = 'accepted'
        )
      `, [myId, mutualUserId]);
      return NextResponse.json({ mutualFriends: rows });
    } catch (error) {
      console.error('Database error (mutualFriends):', error);
      return NextResponse.json(
        { error: 'Failed to fetch mutual friends', details: error.message },
        { status: 500 }
      );
    } finally {
      if (connection) connection.release();
    }
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
    const { name, userIds, chatId } = body;
    connection = await pool.getConnection();

    // --- Добавление участников в существующую группу ---
    if (chatId && Array.isArray(userIds) && userIds.length > 0) {
      // Проверяем, что текущий пользователь — создатель группы
      const [rows] = await connection.query(
        'SELECT created_by FROM messengerapp.group_chats WHERE id = ?',
        [chatId]
      );
      if (!rows.length || rows[0].created_by !== userId) {
        return NextResponse.json(
          { error: 'Only the group creator can add members' },
          { status: 403 }
        );
      }
      // Добавляем только тех, кого ещё нет в группе
      const [existing] = await connection.query(
        'SELECT user_id FROM messengerapp.group_chat_members WHERE chat_id = ? AND user_id IN (?)',
        [chatId, userIds]
      );
      const existingIds = new Set(existing.map(e => e.user_id));
      const toAdd = userIds.filter(uid => !existingIds.has(uid));
      if (toAdd.length === 0) {
        return NextResponse.json({ added: 0 });
      }
      const values = toAdd.map(uid => `(${chatId}, ${uid}, 'member', NOW())`).join(',');
      await connection.query(
        `INSERT INTO messengerapp.group_chat_members (chat_id, user_id, role, joined_at) VALUES ${values}`
      );
      return NextResponse.json({ added: toAdd.length });
    }

    // --- Создание новой группы ---
    if (!name || !Array.isArray(userIds) || userIds.length < 3) {
      return NextResponse.json(
        { error: 'Group name and at least 3 userIds are required' },
        { status: 400 }
      );
    }

    await connection.beginTransaction();

    // 1. Создать запись в group_chats
    const [chatResult] = await connection.execute(
      'INSERT INTO messengerapp.group_chats (name, created_by, created_at) VALUES (?, ?, NOW())',
      [name, userId]
    );
    const newChatId = chatResult.insertId;

    // 2. Добавить участников в group_chat_members
    const memberValues = userIds.map(uid => {
      const role = (uid === userId) ? "'creator'" : "'member'";
      return `(${newChatId}, ${uid}, ${role}, NOW())`;
    }).join(',');
    
    await connection.query(
      `INSERT INTO messengerapp.group_chat_members (chat_id, user_id, role, joined_at) VALUES ${memberValues}`
    );

    await connection.commit();
    return NextResponse.json({ chatId: newChatId, name });
  } catch (error) {
    if (connection) await connection.rollback?.();
    console.error('Error creating group chat or adding members:', error);
    return NextResponse.json(
      { error: 'Failed to create group chat or add members', details: error.message },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}