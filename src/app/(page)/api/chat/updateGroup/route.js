import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import jwt from 'jsonwebtoken';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE
});

export async function PUT(request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const token = authHeader.split(' ')[1];
  let userId;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    userId = decoded.id;
  } catch (err) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  let connection;
  try {
    const formData = await request.formData();
    const chatId = formData.get('chatId');
    const name = formData.get('name');
    const avatarFile = formData.get('avatar');
    
    if (!chatId) {
      return NextResponse.json({ error: 'Chat ID is required' }, { status: 400 });
    }

    connection = await pool.getConnection();

    // 1. Проверить, является ли пользователь создателем чата
    const [rows] = await connection.execute(
      'SELECT role FROM messengerapp.group_chat_members WHERE chat_id = ? AND user_id = ?',
      [chatId, userId]
    );

    if (rows.length === 0 || rows[0].role !== 'creator') {
      return NextResponse.json({ error: 'Forbidden: You are not the creator of this group.' }, { status: 403 });
    }

    let newAvatarUrl = null;
    let nameChanged = false;
    let avatarChanged = false;

    // 2. Если есть новый аватар, загрузить его
    if (avatarFile) {
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      if (!existsSync(uploadDir)) await mkdir(uploadDir, { recursive: true });

      const buffer = Buffer.from(await avatarFile.arrayBuffer());
      const fileName = `${chatId}_${Date.now()}_${avatarFile.name}`;
      const filePath = path.join(uploadDir, fileName);
      await writeFile(filePath, buffer);
      newAvatarUrl = `/uploads/${fileName}`;
      avatarChanged = true;
    }

    // 3. Обновить информацию в БД
    if (name) {
      await connection.execute(
        'UPDATE messengerapp.group_chats SET name = ? WHERE id = ?',
        [name, chatId]
      );
      nameChanged = true;
    }
    if (newAvatarUrl) {
      await connection.execute(
        'UPDATE messengerapp.group_chats SET avatar_url = ? WHERE id = ?',
        [newAvatarUrl, chatId]
      );
    }
    
    connection.release();
    
    return NextResponse.json({
      success: true,
      newName: name,
      newAvatarUrl,
      nameChanged,
      avatarChanged,
    });

  } catch (error) {
    if (connection) connection.release();
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to update group settings' }, { status: 500 });
  }
} 