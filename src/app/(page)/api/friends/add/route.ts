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
  // Получаем токен из cookies
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    return NextResponse.json(
      { error: 'Authorization token is missing' },
      { status: 401 }
    );
  }

  let userId;
  try {
    // Верифицируем JWT токен
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as { id: string };
    userId = decoded.id;
  } catch (err) {
    return NextResponse.json(
      { error: 'Invalid or expired token', details: err.message },
      { status: 401 }
    );
  }

  // Парсим тело запроса
  let friendId;
  try {
    const body = await request.json();
    friendId = body.friendId;
    
    if (!friendId) {
      return NextResponse.json(
        { error: 'Friend ID is required' },
        { status: 400 }
      );
    }
  } catch (err) {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }

  let connection;
  try {
    connection = await pool.getConnection();

    // 1. Проверяем, существует ли пользователь, которого добавляем
    const [userExists] = await connection.execute(
      'SELECT user_id FROM messengerapp.user_profiles WHERE user_id = ?',
      [friendId]
    );

    if (userExists.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // 2. Проверяем, не добавлен ли уже пользователь
    const [existing] = await connection.execute(
      'SELECT * FROM messengerapp.friends WHERE user_id = ? AND friend_id = ?',
      [userId, friendId]
    );

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'This user is already your friend' },
        { status: 400 }
      );
    }

    // 3. Добавляем в друзья (двусторонняя связь)
    await connection.beginTransaction();

    try {
      // Добавляем друга для текущего пользователя
      await connection.execute(
        'INSERT INTO messengerapp.friends (user_id, friend_id, created_at) VALUES (?, ?, NOW())',
        [userId, friendId]
      );

      // И наоборот (если нужна взаимная дружба)
      await connection.execute(
        'INSERT INTO messengerapp.friends (user_id, friend_id, created_at) VALUES (?, ?, NOW())',
        [friendId, userId]
      );

      await connection.commit();
    } catch (err) {
      await connection.rollback();
      throw err;
    }

    return NextResponse.json(
      { success: true, message: 'Friend added successfully' }
    );
  } catch (err) {
    console.error('Database error:', err);
    return NextResponse.json(
      { error: 'Failed to add friend', details: err.message },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}