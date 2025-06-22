import { NextResponse } from 'next/server';
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

// Создание пула соединений
const pool = mysql.createPool(dbConfig);

// Белый список разрешенных полей для обновления
const ALLOWED_FIELDS = ['second_name', 'bio', 'avatar_url', 'location'];

export async function POST(request) {
  let connection;
  try {
    const { field, value, userId } = await request.json();

    // Валидация данных
    if (!field || !userId || value === undefined) {
      return NextResponse.json(
        { error: 'Недостаточно данных: требуется field, userId и value' },
        { status: 400 }
      );
    }

    // Проверка, что поле разрешено для обновления
    if (!ALLOWED_FIELDS.includes(field)) {
      return NextResponse.json(
        { error: `Недопустимое поле для обновления: ${field}` },
        { status: 400 }
      );
    }

    connection = await pool.getConnection();
    
    // Безопасное обновление с параметризованным запросом
    const [result] = await connection.execute(
      `UPDATE messengerapp.user_profiles
       SET ${field} = ?
       WHERE user_id = ?`,
      [value, userId]
    );
    console.log('Полученные данные:', { field, value, userId });
    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: 'Профиль не найден или данные не изменились' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Данные успешно обновлены' },
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