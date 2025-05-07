import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
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


const pool = mysql.createPool(dbConfig);
export async function POST(request: Request) {
    let connection;
  
    try {
      const { content, senderId, receiverId } = await request.json();
  
      // Валидация
      if (!content || !senderId || !receiverId) {
        return NextResponse.json(
          { error: 'Не хватает обязательных полей' },
          { status: 400 }
        );
      }
  
      connection = await pool.getConnection();
  
      // 1. Находим существующий чат
      const [chat] = await connection.execute(
        `SELECT id FROM messengerapp.chats
         WHERE (user1_id = ? AND user2_id = ?)
         OR (user1_id = ? AND user2_id = ?)`,
        [senderId, receiverId, receiverId, senderId]
      );
  
      let chatId;
      if (chat.length === 0) {
        // 2. Создаем новый чат если не найден
        const [newChat] = await connection.execute(
          `INSERT INTO messengerapp.chats (user1_id, user2_id)
           VALUES (?, ?)`,
          [senderId, receiverId]
        );
        chatId = newChat.insertId;
      } else {
        chatId = chat[0].id;
      }
  
      // 3. Сохраняем сообщение
      const [result] = await connection.execute(
        `INSERT INTO messengerapp.messages
         (chat_id, sender_id, content)
         VALUES (?, ?, ?)`,
        [chatId, senderId, content]
      );
  
      return NextResponse.json({
        success: true,
        messageId: result.insertId
      });
  
    } catch (error) {
      console.error('Ошибка отправки:', error);
      return NextResponse.json(
        { error: 'Ошибка сервера' },
        { status: 500 }
      );
    } finally {
      if (connection) connection.release();
    }
  }