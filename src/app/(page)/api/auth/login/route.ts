import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';
import jwt from 'jsonwebtoken';
import 'dotenv/config';
import { Server } from 'socket.io'; // Добавлен импорт Socket.IO

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

// Инициализация Socket.IO сервера (выносим за пределы функции)
// Комментарий: Создаем HTTP сервер для Socket.IO
// const httpServer = require('http').createServer();
// const io = new Server(httpServer, {
//   cors: {
//     origin: "*", // Настройте правильно для production
//   },
// });

// // Хранилище подключений пользователей
// const userSockets = new Map();

export async function POST(request: Request) {
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
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    // Комментарий: Здесь можно инициировать подключение к Socket.IO
    // Но в API-роуте это не рекомендуется, лучше делать на клиенте
    // Вместо этого добавляем флаг, что пользователь может подключиться
    // const socketData = {
    //   userId: user.id,
    //   token: token,
    //   status: 'authenticated'
    // };

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
        socket: { // Добавляем данные для подключения к сокету
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

// Комментарий: Обработчики Socket.IO (добавляются отдельно)
// io.on('connection', (socket) => {
//   console.log('Новое подключение:', socket.id);

//   // Обработчик аутентификации через JWT
//   socket.on('authenticate', (token) => {
//     try {
//       // Верифицируем токен
//       const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
//         id: string;
//         email: string;
//       };

//       // Проверяем, есть ли уже подключение для этого пользователя
//       if (userSockets.has(decoded.id)) {
//         const oldSocket = userSockets.get(decoded.id);
//         // Закрываем старое подключение, если оно существует
//         if (oldSocket && oldSocket.connected) {
//           oldSocket.disconnect();
//         }
//       }

//       // Сохраняем новое подключение
//       userSockets.set(decoded.id, socket);
//       console.log(`Пользователь ${decoded.id} (${decoded.email}) аутентифицирован`);

//       // Отправляем подтверждение клиенту
//       socket.emit('authentication_success', {
//         userId: decoded.id,
//         message: 'Аутентификация прошла успешно'
//       });

//       // Привязываем ID пользователя к сокету для удобства
//       socket.data.userId = decoded.id;

//     } catch (err) {
//       console.error('Ошибка аутентификации:', err.message);
      
//       // Отправляем сообщение об ошибке клиенту
//       socket.emit('authentication_error', {
//         message: 'Неверный токен аутентификации'
//       });
      
//       // Закрываем соединение при ошибке аутентификации
//       socket.disconnect();
//     }
//   });

//   // Обработчик отключения
//   socket.on('disconnect', () => {
//     // Удаляем только если это тот же сокет, что сохранен в мапе
//     if (socket.data.userId) {
//       const storedSocket = userSockets.get(socket.data.userId);
//       if (storedSocket && storedSocket.id === socket.id) {
//         userSockets.delete(socket.data.userId);
//         console.log(`Пользователь ${socket.data.userId} отключен`);
//       }
//     }
//   });
// });