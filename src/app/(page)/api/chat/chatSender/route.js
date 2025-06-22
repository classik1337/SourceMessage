import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import mysql from 'mysql2/promise';
import CryptoJS from 'crypto-js';
import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

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
const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');

// Функция для создания директории, если она не существует
const ensureUploadsDirExists = async () => {
  try {
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creating uploads directory:', error);
  }
};

// Вызываем функцию при старте сервера
ensureUploadsDirExists();

export async function POST(request) {
  let connection;

  try {
    const formData = await request.formData();
    const senderId = formData.get('senderId');
    const receiverId = formData.get('receiverId');
    const chatId = formData.get('chatId');
    const text = formData.get('text');
    const files = formData.getAll('files');

    if (!senderId || !receiverId) {
      return NextResponse.json({ error: 'Missing sender or receiver ID' }, { status: 400 });
    }
    if (String(senderId) === String(receiverId)) {
      return NextResponse.json({ error: 'Нельзя создать чат с самим собой' }, { status: 400 });
    }
    // Сортируем id для соблюдения ограничения user1_id < user2_id
    let firstId = Number(senderId);
    let secondId = Number(receiverId);
    if (firstId > secondId) {
      [firstId, secondId] = [secondId, firstId];
    }

    connection = await pool.getConnection();
    // Теперь можно искать/создавать чат
    let currentChatId = chatId;
    if (!currentChatId || currentChatId === 'null' || currentChatId === null) {
      const [chat] = await connection.execute(
        `SELECT id FROM messengerapp.chats WHERE (user1_id = ? AND user2_id = ?)`,
        [firstId, secondId]
      );
      if (chat.length > 0) {
        currentChatId = chat[0].id;
      } else {
        const [newChat] = await connection.execute(`INSERT INTO messengerapp.chats (user1_id, user2_id) VALUES (?, ?)`, [firstId, secondId]);
        currentChatId = newChat.insertId;
      }
    }
    await connection.beginTransaction();

    if (!text && files.length === 0) {
      return NextResponse.json({ error: 'Cannot send an empty message' }, { status: 400 });
    }

    // 2. Создаем родительское сообщение
    const messageType = files.length > 0 ? 'collection' : 'text';
    const encryptedText = text ? CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString() : '';

    const [messageResult] = await connection.execute(
      `INSERT INTO messengerapp.messages (chat_id, sender_id, content, type) VALUES (?, ?, ?, ?)`,
      [currentChatId, senderId, encryptedText, messageType]
    );
    const messageId = messageResult.insertId;

    // 3. Обрабатываем и сохраняем файлы
    const savedFilesData = [];
    if (files.length > 0) {
      // Убедимся, что таблица message_files существует
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS messengerapp.message_files (
          id INT AUTO_INCREMENT PRIMARY KEY,
          message_id INT NOT NULL,
          file_path VARCHAR(255) NOT NULL,
          original_name VARCHAR(255) NOT NULL,
          file_type VARCHAR(100) NOT NULL,
          file_size INT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (message_id) REFERENCES messengerapp.messages(id) ON DELETE CASCADE
        );
      `);

      for (const file of files) {
        const fileBuffer = Buffer.from(await file.arrayBuffer());
        const fileExtension = path.extname(file.name).toLowerCase();
        const uniqueFileName = `${uuidv4()}${fileExtension}`;
        const filePath = path.join(UPLOADS_DIR, uniqueFileName);
        await fs.writeFile(filePath, fileBuffer);
        const fileUrl = `/uploads/${uniqueFileName}`;

        // Определяем fileType по расширению, если file.type пустой
        let fileType = file.type;
        if (!fileType || fileType === '') {
          switch (fileExtension) {
            case '.jpg': case '.jpeg': case '.png': case '.gif': case '.bmp': case '.webp': case '.svg':
              fileType = 'image/' + fileExtension.replace('.', ''); break;
            case '.mp4': case '.webm': case '.ogg': case '.mov': case '.avi':
              fileType = 'video/' + fileExtension.replace('.', ''); break;
            case '.mp3': case '.wav': case '.aac': case '.flac':
              fileType = 'audio/' + fileExtension.replace('.', ''); break;
            case '.pdf': fileType = 'application/pdf'; break;
            case '.doc': case '.docx': fileType = 'application/msword'; break;
            case '.xls': case '.xlsx': fileType = 'application/vnd.ms-excel'; break;
            case '.ppt': case '.pptx': fileType = 'application/vnd.ms-powerpoint'; break;
            case '.zip': case '.rar': case '.7z': fileType = 'application/zip'; break;
            default: fileType = 'application/octet-stream'; break;
          }
        }

        await connection.execute(
          `INSERT INTO messengerapp.message_files (message_id, file_path, original_name, file_type, file_size) VALUES (?, ?, ?, ?, ?)`,
          [messageId, fileUrl, file.name, fileType, file.size]
        );

        savedFilesData.push({
          path: fileUrl,
          name: file.name,
          type: fileType,
          size: file.size
        });
      }
    }
    
    await connection.commit();

    // Отправка через сокеты (здесь должен быть ваш код для сокетов)
    // socket.emit('new-message', { ... });

    return NextResponse.json({
      success: true,
      messageId: messageId,
      chatId: currentChatId,
      text: text,
      files: savedFilesData
    });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Ошибка отправки:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
} 