import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import mysql from 'mysql2/promise';

// Конфигурация подключения к БД
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

export async function GET() {
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

    // Декодируем токен
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Получаем соединение из пула
    connection = await pool.getConnection();

    // Выполняем запрос к таблице user_profiles
    const [profileRows] = await connection.execute(
      `SELECT up.*, u.create_at 
       FROM messengerapp.user_profiles up 
       JOIN messengerapp.users u ON up.user_id = u.id 
       WHERE up.user_id = ?`,
      [decoded.id]
    );

    // Приводим к типу, так как MySQL возвращает RowDataPacket[]
    const userProfile = Array.isArray(profileRows) ? profileRows[0] : null;

    // Формируем ответ
    return NextResponse.json({
      email: decoded.email,
      id: decoded.id,
      login: decoded.login,
      role: decoded.role,
      description: userProfile?.bio || null,
      avatar: userProfile?.avatar_url || null,
      location: userProfile?.location || null,
      secondlogin: userProfile?.second_name || null,
      created_at: userProfile?.create_at || null,
      profile: userProfile || null // Добавляем данные профиля или null если не найден
    });

  } catch (err) {
    console.error('Ошибка при получении профиля:', err);
    return NextResponse.json(
      { error: 'Неверный токен или ошибка сервера' },
      { status: 403 }
    );
  } finally {
    // Всегда возвращаем соединение в пул
    if (connection) connection.release();
  }
} 