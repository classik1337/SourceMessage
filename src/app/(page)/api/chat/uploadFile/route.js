import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import CryptoJS from 'crypto-js';

const dbConfig = {
  host: process.env.MYSQL_HOST,
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
};
const pool = mysql.createPool(dbConfig);
const ENCRYPTION_KEY = process.env.SECRET_KEY;

export async function POST(request) {
  let connection;
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const senderId = formData.get('senderId');
    const receiverId = formData.get('receiverId');
    let chatId = formData.get('chatId');

    if (!file || !senderId || !receiverId) {
      return NextResponse.json({ error: 'Недостаточно данных' }, { status: 400 });
    }

    const originalName = file.name;
    
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = path.extname(originalName);
    const storedFileName = `${timestamp}_${randomString}${fileExtension}`;

    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, storedFileName);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    const storedFilePath = `/uploads/${storedFileName}`;
    const encryptedFileName = CryptoJS.AES.encrypt(originalName, ENCRYPTION_KEY).toString();

    connection = await pool.getConnection();

    if (!chatId || chatId === 'null' || chatId === 'undefined') {
      const [chatRows] = await connection.execute(
        `SELECT id FROM messengerapp.chats WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)`,
        [senderId, receiverId, receiverId, senderId]
      );
      if (chatRows.length > 0) {
        chatId = chatRows[0].id;
      } else {
        const [newChat] = await connection.execute(
          `INSERT INTO messengerapp.chats (user1_id, user2_id) VALUES (?, ?)`,
          [senderId, receiverId]
        );
        chatId = newChat.insertId;
      }
    }

    const [result] = await connection.execute(
      `INSERT INTO messengerapp.messages (chat_id, sender_id, content, type, fileName) VALUES (?, ?, ?, 'file', ?)`,
      [chatId, senderId, storedFilePath, encryptedFileName]
    );

    return NextResponse.json({
      success: true,
      messageId: result.insertId,
      fileName: originalName,
      filePath: storedFilePath,
      fileSize: buffer.length,
      type: 'file',
      chatId: chatId
    });

  } catch (error) {
    console.error('Ошибка загрузки файла:', error);
    return NextResponse.json({ error: 'Ошибка сервера при загрузке файла' }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
} 