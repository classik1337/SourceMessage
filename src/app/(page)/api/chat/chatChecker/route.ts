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
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
    const userId = decoded.id; //Получение моего id
    
    

    if (!userId) {
      return NextResponse.json(
        { error: 'Недостаточно данных: требуется myId' },
        { status: 400 }
      );
    }

    connection = await pool.getConnection();

    const [messages] = await connection.execute(
      `SELECT 
        m.id AS message_id,
        m.content,
        m.sent_at,
        m.is_read,
        
        c.id AS chat_id,
        CASE 
          WHEN c.user1_id = ? THEN c.user2_id 
          ELSE c.user1_id 
        END AS friend_id,
        
        friend.username AS friend_username,
       
        
        up.full_name AS friend_full_name,
        up.second_name AS friend_second_name,
        up.avatar_url AS friend_avatar_url,
        
        f.status AS friendship_status
      FROM 
        messengerapp.messages m
      JOIN 
        messengerapp.chats c ON m.id = c.last_message_id
      LEFT JOIN 
        messengerapp.users friend ON (
          friend.id = CASE WHEN c.user1_id = ? THEN c.user2_id ELSE c.user1_id END
        )
      LEFT JOIN 
        messengerapp.user_profiles up ON up.user_id = friend.id
      LEFT JOIN 
        messengerapp.friends f ON (
          (f.user_id = ? AND f.friend_id = friend.id) OR
          (f.friend_id = ? AND f.user_id = friend.id)
        )
      WHERE 
        ? IN (c.user1_id, c.user2_id)`,
      [userId, userId, userId, userId, userId]
    );

    if (messages.length === 0) {
      return NextResponse.json(
        { messages: [] },
        { status: 200 }
      );
    }
    
    // Преобразуем данные в формат для MessageItem
    const formattedMessages = messages.map(message => ({
      idFriend: message.friend_id,
      nameFriend: message.friend_second_name || message.friend_username,
      avatarSrc: message.friend_avatar_url || '/castle.jpg',
      timeMessage: formatTime(message.sent_at),
      contentMessage: message.content,
      isRead: message.is_read,
      chatId: message.chat_id
    }));
    
    return NextResponse.json(
      { messages: formattedMessages },
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

// Вспомогательная функция для форматирования времени
function formatTime(dateTimeString) {
  if (!dateTimeString) return '00:00';
  
  const date = new Date(dateTimeString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}