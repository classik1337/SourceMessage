import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';
import jwt from 'jsonwebtoken';
import 'dotenv/config';

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

// Создание пула соединений
const pool = mysql.createPool(dbConfig);

export async function POST(request) {
  let connection;
  try {
    const { email, password } = await request.json();

    // Проверка наличия логина и пароля
    if (!email || !password) {
      return NextResponse.json(
        { message: 'Логин и пароль обязательны' },
        { status: 400 }
      );
    }

    // Подключение к базе данных
    connection = await pool.getConnection();

    // Поиск пользователя по логину
    const [rows] = await connection.execute(
      'SELECT * FROM `messengerapp`.`users` WHERE email= ?',
      [email]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { message: 'Пользователь не найден' },
        { status: 404 }
      );
    }

    const user = rows[0];
    console.log(user.login, user.role, user.id);
    
    // Сравнение хешированного пароля
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { message: 'Неверный пароль' },
        { status: 401 }
      );
    }

    // Создание JWT токена
    const token = jwt.sign(
      { 
        email: user.email,
        id: user.id,
        login: user.username,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Успешный вход
    const response = NextResponse.json(
      {
        message: 'Пользователь успешно зашел',
        user: { 
          id: user.idUsers, 
          login: user.Login, 
          role: user.Role, 
          email: user.Email 
        },
        socket: {
          server: process.env.SOCKET_SERVER_URL || 'http://localhost:3001',
          token: token
        }
      },
      { status: 200 }
    );

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 86400,
      sameSite: 'strict',
    });

    return response;

  } catch (error) {
    console.error('Ошибка при входе:', error);
    return NextResponse.json(
      { message: 'Ошибка сервера' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
} 