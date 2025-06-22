import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import mysql from 'mysql2/promise';
import CryptoJS from 'crypto-js';

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

const ENCRYPTION_KEY = process.env.SECRET_KEY;

// Функция для расшифровки сообщения
function decryptMessage(encryptedContent) {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedContent, ENCRYPTION_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return decrypted || '[Ошибка расшифровки]';
  } catch (e) {
    // Если не удалось расшифровать, возвращаем исходное сообщение (возможно, старое незашифрованное)
    return encryptedContent;
  }
}

// Функция форматирования времени
function formatMessageTime(dateTimeString) {
  if (!dateTimeString) return '00:00';
  
  const messageDate = new Date(dateTimeString);
  const today = new Date();
  
  // Сброс времени для сравнения только дат
  const messageDay = new Date(messageDate.getFullYear(), messageDate.getMonth(), messageDate.getDate());
  const todayDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  
  if (messageDay.getTime() === todayDay.getTime()) {
    // Если сообщение сегодня, показываем только время
    return messageDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  } else {
    // Если другой день, показываем дату
    return messageDate.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
  }
}

export async function GET(request) {
  let connection;
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

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
        m.sender_id,
        
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
        ? IN (c.user1_id, c.user2_id)
      ORDER BY m.sent_at DESC`,
      [userId, userId, userId, userId, userId]
    );

    if (messages.length === 0) {
      return NextResponse.json(
        { messages: [] },
        { status: 200 }
      );
    }
    
    // Преобразуем данные в формат для MessageItem с расшифровкой
    const formattedMessages = messages.map(message => ({
      idFriend: message.friend_id,
      nameFriend: message.friend_second_name || message.friend_username,
      avatarSrc: message.friend_avatar_url || '/castle.jpg',
      timestamp: message.sent_at,
      timeMessage: formatMessageTime(message.sent_at),
      contentMessage: decryptMessage(message.content), // Расшифрованное сообщение
      isMyMessage: message.sender_id === userId,
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