import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';
import jwt from 'jsonwebtoken';
import 'dotenv/config';

// Конфигурация базы данных (используем ту же, что и для входа)
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
    const { email, password, name } = await request.json();

    // Валидация входных данных
    if (!email || !password || !name) {
      return NextResponse.json(
        { message: 'Email, логин и пароль обязательны' },
        { status: 400 }
      );
    }

    // Проверка сложности пароля (опционально)
    if (password.length < 6) {
      return NextResponse.json(
        { message: 'Пароль должен содержать минимум 6 символов' },
        { status: 400 }
      );
    }

    connection = await pool.getConnection();

    // Проверка, не занят ли email
    const [emailCheck] = await connection.execute(
      'SELECT * FROM `messengerapp`.`users` WHERE email = ?',
      [email]
    );

    if (emailCheck.length > 0) {
      return NextResponse.json(
        { message: 'Пользователь с таким email уже существует' },
        { status: 409 }
      );
    }

    // Проверка, не занят ли логин
    const [loginCheck] = await connection.execute(
      'SELECT * FROM `messengerapp`.`users` WHERE username = ?',
      [name]
    );

    if (loginCheck.length > 0) {
      return NextResponse.json(
        { message: 'Пользователь с таким логином уже существует' },
        { status: 409 }
      );
    }

    // Хеширование пароля
    const hashedPassword = await bcrypt.hash(password, 10);

    // Создание нового пользователя
    const [result] = await connection.execute(
      'INSERT INTO `messengerapp`.`users` (email, username, password, role) VALUES (?, ?, ?, ?)',
      [email, name, hashedPassword, 5] // По умолчанию роль 'user'
    );

    // Получаем ID нового пользователя
    const newUserId = result.insertId;

    // Создание JWT токена
    const token = jwt.sign(
      { id: newUserId, login: name, role: 'user' },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );

    // Успешный ответ
    const response = NextResponse.json(
      {
        message: 'Пользователь успешно зарегистрирован',
        user: { id: newUserId, login: name, role: 'user' },
      },
      { status: 201 }
    );

    // Установка куки с токеном
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 3600,
      sameSite: 'strict',
    });

    return response;

  } catch (error) {
    console.error('Ошибка при регистрации:', error);
    return NextResponse.json(
      { message: 'Ошибка сервера при регистрации' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
}