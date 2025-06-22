import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import 'dotenv/config';
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

export async function GET(request) {
  let connection;
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Токен отсутствует' },
        { status: 401 }
      );
    }

    // Валидация токена
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id; //Получение моего id

    connection = await pool.getConnection();

    // 1. Получаем всех друзей со статусом 'accepted' (односторонние и двусторонние)
    const [friendsRows] = await connection.execute(
      'SELECT * FROM messengerapp.friends WHERE (user_id = ? OR friend_id = ?) AND status = ?',
      [userId, userId, 'accepted']
    );
    if (!Array.isArray(friendsRows) || friendsRows.length === 0) {
      return NextResponse.json(
        { message: 'У вас пока нет друзей', friends: [] },
        { status: 200 }
      );
    }

    // 2. Собираем ID всех друзей (уникальные)
    const friendIds = [...new Set(friendsRows.map(row => row.user_id === userId ? row.friend_id : row.user_id))];
    if (friendIds.length === 0) {
      return NextResponse.json(
        { message: 'У вас пока нет друзей', friends: [] },
        { status: 200 }
      );
    }

    // 3. Получаем информацию о друзьях
    const [friendsInfo] = friendIds.length > 0 ? await connection.execute(
      `SELECT * FROM messengerapp.user_profiles WHERE user_id IN (${friendIds.map(() => "?").join(",")})`,
      friendIds
    ) : [[]];
    const friends = Array.isArray(friendsInfo) ? friendsInfo.map(friend => ({
      user_id: userId,
      friend_id: friend.user_id,
      status: 'accepted',
      description: friend.bio || null,
      avatar: friend.avatar_url || '/castle.jpg',
      location: friend.location || null,
      secondlogin: friend.second_name || null,
      profile: friend
    })) : [];

    // 5. Входящие заявки (pending, friend_id = мой id)
    const [incomingRows] = await connection.execute(
      'SELECT f.*, u.avatar_url, u.second_name, u.full_name FROM messengerapp.friends f JOIN messengerapp.user_profiles u ON f.user_id = u.user_id WHERE f.friend_id = ? AND f.status = ? ORDER BY f.created_at DESC',
      [userId, 'pending']
    );
    // 6. Исходящие заявки (pending, user_id = мой id)
    const [outgoingRows] = await connection.execute(
      'SELECT f.*, u.avatar_url, u.second_name, u.full_name FROM messengerapp.friends f JOIN messengerapp.user_profiles u ON f.friend_id = u.user_id WHERE f.user_id = ? AND f.status = ? ORDER BY f.created_at DESC',
      [userId, 'pending']
    );
    const incoming = incomingRows.map(row => ({
      id: row.id,
      user_id: row.user_id, // кто отправил
      avatar: row.avatar_url || '/castle.jpg',
      second_name: row.second_name || '',
      full_name: row.full_name || '',
      created_at: row.created_at,
    }));
    const outgoing = outgoingRows.map(row => ({
      id: row.id,
      friend_id: row.friend_id, // кому отправил
      avatar: row.avatar_url || '/castle.jpg',
      second_name: row.second_name || '',
      full_name: row.full_name || '',
      created_at: row.created_at,
    }));

    return NextResponse.json({ friends, incoming, outgoing });

  } catch (error) {
    console.error('Ошибка при получении данных:', error);
    return NextResponse.json(
      { message: 'Ошибка сервера' },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
} 