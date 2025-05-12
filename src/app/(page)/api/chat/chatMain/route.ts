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
export async function GET(request) {
  let connection;
  try {
    const { searchParams } = new URL(request.url);
    const myId = searchParams.get('myId');
    const friendId = searchParams.get('friendId');

    // Валидация данных
    if (!myId || !friendId) {
      return NextResponse.json(
        { error: 'Недостаточно данных: требуется myId и friendId' },
        { status: 400 }
      );
    }
    // console.log(myId, friendId) // работает
    connection = await pool.getConnection();
    const [messages] = await connection.execute(
      `SELECT 
          m.id,
          m.sender_id,
          u.username AS sender_name,
          m.content,
          m.sent_at,
          m.is_read
       FROM 
          messengerapp.messages m
       JOIN 
          messengerapp.users u ON m.sender_id = u.id
       WHERE 
          m.chat_id = (
             SELECT id 
             FROM messengerapp.chats 
             WHERE (user1_id = ? AND user2_id = ?) 
                OR (user1_id = ? AND user2_id = ?)
          )
       ORDER BY 
          m.sent_at DESC
       LIMIT 30;`,
      [myId, friendId, friendId, myId]  
    );

 
    const lastMessageChat = messages.at(0)
    const i = (lastMessageChat.id)


    
    const [lastMessage] = await connection.execute(
      `UPDATE messengerapp.chats
      SET

      last_message_id = ?
      WHERE user1_id = ? and user2_id = ? 
      or 
      user2_id = ? and user1_id = ?
      `,
      [i, myId, friendId, friendId, myId]  
    );

    if (messages.length === 0) {
      return NextResponse.json(
        { messages: [] },
        { status: 200 }
      );
    }
  

    return NextResponse.json(
      
      { messages },
      { status: 200 }
    );
   
  } catch (error) {
    console.error('Ошибка базы данных:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}

