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

export async function GET(request) {
  let connection;
  try {
    const { searchParams } = new URL(request.url);
    const myId = searchParams.get('myId');
    const friendId = searchParams.get('friendId');

    if (!myId || !friendId) {
      return NextResponse.json({ error: 'Недостаточно данных: требуется myId и friendId' }, { status: 400 });
    }

    connection = await pool.getConnection();
    const [messages] = await connection.execute(
      `SELECT m.id, m.sender_id, u.username AS sender_name, m.content, m.sent_at, m.is_read, m.type
       FROM messengerapp.messages m
       JOIN messengerapp.users u ON m.sender_id = u.id
       WHERE m.chat_id = (
         SELECT id FROM messengerapp.chats 
         WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)
       )
       ORDER BY m.sent_at DESC
       LIMIT 50;`,
      [myId, friendId, friendId, myId]
    );

    const messageIds = messages.map(msg => msg.id);
    let files = [];

    if (messageIds.length > 0) {
      const [fileRows] = await connection.execute(
        `SELECT message_id, file_path, original_name, file_type, file_size 
         FROM messengerapp.message_files 
         WHERE message_id IN (${messageIds.map(() => '?').join(',')})`,
        messageIds
      );
      files = fileRows;
    }

    const filesByMessageId = files.reduce((acc, file) => {
      if (!acc[file.message_id]) {
        acc[file.message_id] = [];
      }
      acc[file.message_id].push({
        content: file.file_path,
        fileName: file.original_name,
        fileType: file.file_type,
        fileSize: file.file_size
      });
      return acc;
    }, {});
    
    const processedMessages = messages.map(msg => {
      const decryptedContent = (msg.type === 'text' || msg.type === 'collection') && msg.content 
        ? decryptMessage(msg.content) 
        : msg.content;

      return {
        ...msg,
        content: decryptedContent,
        files: filesByMessageId[msg.id] || []
      };
    });

    const lastMessage = processedMessages[0];
    if (lastMessage?.id) {
      await connection.execute(
        `UPDATE messengerapp.chats
         SET last_message_id = ?
         WHERE (user1_id = ? AND user2_id = ?) OR (user2_id = ? AND user1_id = ?)`,
        [lastMessage.id, myId, friendId, myId, friendId]
      );
    }

    return NextResponse.json({ messages: processedMessages }, { status: 200 });
   
  } catch (error) {
    console.error('Ошибка базы данных:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}