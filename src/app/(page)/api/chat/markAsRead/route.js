import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import mysql from 'mysql2/promise';

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

export async function PUT(request) {
  let connection;
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  try {
    // Проверка аутентификации
    if (!token) {
      return NextResponse.json(
        { error: 'Необходима авторизация' },
        { status: 401 }
      );
    }

    // Валидация токена
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    // Получаем данные из тела запроса
    const { messageIds, chatId } = await request.json();

    // Валидация входных данных
    if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0 || !chatId) {
      return NextResponse.json(
        { error: 'Некорректные данные: требуются messageIds (массив) и chatId' },
        { status: 400 }
      );
    }

    connection = await pool.getConnection();

    // 1. Проверяем доступ пользователя к чату
    const [chat] = await connection.execute(
      `SELECT * FROM messengerapp.chats 
       WHERE id = ? AND (user1_id = ? OR user2_id = ?)`,
      [chatId, userId, userId]
    );

    if (chat.length === 0) {
      return NextResponse.json(
        { error: 'Чат не найден или нет доступа' },
        { status: 403 }
      );
    }

    // 2. Обновляем статус сообщений
    // Формируем строку с placeholders для каждого ID
    const placeholders = messageIds.map(() => '?').join(',');
    
    const [result] = await connection.execute(
      `UPDATE messengerapp.messages 
       SET is_read = TRUE 
       WHERE id IN (${placeholders}) 
         AND chat_id = ? 
         AND sender_id != ? 
         AND is_read = FALSE`,
      [...messageIds, chatId, userId]
    );

    // 3. Проверяем результат
    if (result.affectedRows === 0) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Сообщения не найдены, уже прочитаны или нет прав на обновление'
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      updatedCount: result.affectedRows
    });

  } catch (error) {
    console.error('Ошибка обновления статуса:', error);
    return NextResponse.json(
      { error: 'Ошибка сервера' },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
} 