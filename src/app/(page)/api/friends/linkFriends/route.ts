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

export async function GET(request: Request) {
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
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
    const userId = decoded.id; //Получение моего id

    connection = await pool.getConnection();

    // 1. Получаем всех друзей пользователя
    const [friendsRows] = await connection.execute(
      'SELECT * FROM `messengerapp`.`friends` WHERE user_id = ? OR friend_id = ?',
      [userId, userId] //Получение всех моих друзей из бд
    );
    if (!Array.isArray(friendsRows)) {
      return NextResponse.json(
        { message: 'Друзья не найдены' },
        { status: 404 }
      );
    } 

    // 2. Собираем ID всех друзей
    const friendIds = friendsRows.map(row => {
      const friend = row as any;
      return friend.user_id === userId ? friend.friend_id : friend.user_id;
    });
    if (friendIds.length === 0) {
      return NextResponse.json(
        { message: 'У вас пока нет друзей' },
        { status: 200 }
      );
    }

    // 3. Получаем информацию о друзьях
    const [friendsInfo] = await connection.execute(
        `SELECT * FROM messengerapp.user_profiles WHERE user_id IN (${friendIds.map(() => "?").join(",")})`,
        friendIds
      );
    // 4. Формируем ответ
    const result = Array.isArray(friendsInfo) ? friendsInfo.map(friend => ({
      user_id: userId,
      friend_id: (friend as any).user_id,
      status: 'active', // Можно получить из таблицы friends
      description: (friend as any).bio || null,
      avatar: (friend as any).avatar_url || '/castle.jpg',
      location: (friend as any).location || null,
      secondlogin: (friend as any).second_name || null,
      profile: friend
    })) : [];
    return NextResponse.json(result);

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