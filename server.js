const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Хранилище для соответствия userId → socketId
const userSockets = new Map();
// Хранилище для полной информации о пользователях
const usersInfo = new Map();

// Хранилище для онлайн пользователей
const onlineUsers = new Set();

// В начале файла после объявления хранилищ
const updateOnlineStatus = () => {
  const onlineStatus = {};
  const connectedSockets = Array.from(io.sockets.sockets.keys());
  
  for (const [userId, socketId] of userSockets.entries()) {
    // Пользователь онлайн если его сокет существует в списке подключенных сокетов
    onlineStatus[userId] = connectedSockets.includes(socketId);
  }
  
  // Отправляем всем обновленный статус
  io.emit('online-status-update', onlineStatus);
  
  console.log('\n=== Online Status Update ===', {
    totalUsers: userSockets.size,
    onlineStatus,
    connectedSockets: connectedSockets.length
  });
};

io.on('connection', (socket) => {
  console.log('User connected:', socket.handshake.auth.userId);
  const userId = socket.handshake.auth.userId;

  if (userId) {
    // Сохраняем сокет для пользователя
    userSockets.set(userId, socket.id);
    // Обновляем статусы
    updateOnlineStatus();
  }

  // Обновляем обработчик register-user
  socket.on('register-user', ({ userId, login, avatar, secondlogin }) => {
    if (!userId) {
      console.log('Попытка регистрации без userId');
      return;
    }

    // Если пользователь уже был онлайн с другого сокета, очищаем старое подключение
    const existingSocketId = userSockets.get(userId);
    if (existingSocketId && existingSocketId !== socket.id) {
      const existingSocket = io.sockets.sockets.get(existingSocketId);
      if (existingSocket) {
        console.log(`Отключаем старое подключение пользователя ${userId}`);
        existingSocket.disconnect();
      }
    }

    // Сохраняем соответствие userId → socket
    userSockets.set(userId, socket.id);
    socket.userId = userId;
    
    // Сохраняем полную информацию о пользователе
    const userData = {
      socketId: socket.id,
      login,
      avatar,
      secondlogin,
      connectedAt: new Date(),
      status: 'online',
      lastActivity: new Date()
    };
    
    usersInfo.set(userId, userData);

    console.log(`\n=== Пользователь зарегистрирован ===`, {
      userId,
      login,
      secondlogin,
      socketId: socket.id,
      avatar: avatar ? 'есть' : 'нет'
    });
    
    console.log(`Активные подключения: ${userSockets.size}`);
    
    socket.emit('registration-success', {
      message: `Вы успешно зарегистрированы как ${login || userId}`,
      yourSocketId: socket.id,
      userData
    });
  });

  // Обработчик отключения
  socket.on('disconnect', () => {
    if (socket.userId) {
      const userData = usersInfo.get(socket.userId);
      if (userData) {
        userData.status = 'offline';
        userData.disconnectedAt = new Date();
        userData.disconnectReason = 'client disconnected';
      }
      
      userSockets.delete(socket.userId);
      
      console.log(`\n=== Пользователь отключился ===`, {
        userId: socket.userId,
        login: userData?.login,
        socketId: socket.id
      });
      
      // Обновляем статусы после отключения
      updateOnlineStatus();
    }
  });

  // Обновляем обработчик get-connection-info
  socket.on('get-connection-info', ({ targetUserId }, callback) => {
    const targetId = String(targetUserId);
    const targetData = usersInfo.get(targetId);
    const targetSocketId = userSockets.get(targetId);
    
    // Получаем список активных сокетов
    const activeSockets = Array.from(io.sockets.sockets.keys());
    
    // Проверяем онлайн статус цели
    const isOnline = targetSocketId && activeSockets.includes(targetSocketId);

    // Получаем все активные подключения
    const allConnections = Array.from(userSockets.entries())
      .map(([userId, socketId]) => {
        const isUserOnline = activeSockets.includes(socketId);
        const userData = usersInfo.get(userId) || {};
        
        return {
          userId,
          socketId,
          online: isUserOnline,
          status: isUserOnline ? 'online' : 'offline',
          ...userData
        };
      });

    console.log('\n=== Connection Info Request ===', {
      requester: socket.userId,
      target: targetId,
      targetSocketId,
      isOnline,
      activeConnections: allConnections
        .filter(conn => conn.online)
        .map(conn => conn.userId)
    });

    const response = {
      yourInfo: usersInfo.get(String(socket.userId)),
      targetInfo: targetData,
      targetOnline: isOnline,
      allConnections
    };

    if (typeof callback === 'function') {
      callback(response);
    }

    // Отправляем обновление статусов всем
    const onlineStatus = {};
    allConnections.forEach(conn => {
      onlineStatus[conn.userId] = conn.online;
    });
    io.emit('online-status-update', onlineStatus);
  });

  // Добавляем обработчик для запроса статусов
  socket.on('request-online-status', () => {
    updateOnlineStatus();
  });

  // Обновляем обработчик get-online-users
  socket.on('get-online-users', () => {
    const onlineStatus = {};
    const connectedSockets = Array.from(io.sockets.sockets.keys());
    
    for (const [userId, socketId] of userSockets.entries()) {
      onlineStatus[userId] = connectedSockets.includes(socketId);
    }
    
    socket.emit('online-users', onlineStatus);
  });

  // Обработчики видеозвонков с полной информацией
  socket.on('call-initiate', ({ targetUserId, offer, callerId, callType }) => {
    const callerData = usersInfo.get(callerId);
    const targetData = usersInfo.get(targetUserId);
    
    console.log(`\n=== Инициация звонка ===`, {
      caller: {
        id: callerId,
        login: callerData?.login,
        socketId: socket.id
      },
      target: {
        id: targetUserId,
        login: targetData?.login,
        status: targetData?.status || 'offline'
      },
      callType
    });

    const targetSocketId = userSockets.get(targetUserId);
    if (targetSocketId) {
      console.log(`Отправляю incoming-call...`);
      
      io.to(targetSocketId).emit('incoming-call', {
        offer,
        callerId,
        callType,
        callerSocketId: socket.id,
        callerInfo: { // Добавляем полную информацию о звонящем
          login: callerData?.login,
          avatar: callerData?.avatar,
          secondlogin: callerData?.secondlogin
        }
      });
      
      socket.emit('call-target-info', {
        targetUserId,
        targetSocketId,
        targetStatus: 'online',
        targetInfo: { // Информация о цели звонка
          login: targetData?.login,
          avatar: targetData?.avatar
        }
      });
    } else {
      console.log(`Пользователь ${targetUserId} не найден или оффлайн`);
      socket.emit('call-error', {
        message: `Пользователь ${targetUserId} недоступен`
      });
    }
  });
  
  socket.on('call-answer', ({ targetUserId, answer }) => {
    const responderData = usersInfo.get(socket.userId);
    
    console.log(`\n=== Ответ на звонок ===`, {
      responder: {
        id: socket.userId,
        login: responderData?.login,
        socketId: socket.id
      },
      targetUserId
    });
    
    const targetSocketId = userSockets.get(targetUserId);
    if (targetSocketId) {
      console.log(`Отправляю call-answer...`);
      io.to(targetSocketId).emit('call-answer', { 
        answer,
        responderSocketId: socket.id,
        responderInfo: { // Добавляем информацию об отвечающем
          login: responderData?.login,
          avatar: responderData?.avatar
        }
      });
    }
  });
  
  socket.on('ice-candidate', ({ targetUserId, candidate }) => {
    const senderData = usersInfo.get(socket.userId);
    const targetSocketId = userSockets.get(targetUserId);
    
    console.log(`\n=== ICE Candidate ===`, {
      from: {
        id: socket.userId,
        login: senderData?.login,
        socketId: socket.id
      },
      to: {
        id: targetUserId,
        socketId: targetSocketId
      },
      candidate: {
        type: candidate?.type,
        protocol: candidate?.protocol,
        address: candidate?.address,
        port: candidate?.port,
        candidateType: candidate?.candidateType
      }
    });
    
    if (targetSocketId) {
      // Немедленно отправляем кандидата получателю
      io.to(targetSocketId).emit('ice-candidate', { 
        candidate,
        senderSocketId: socket.id,
        senderInfo: {
          login: senderData?.login
        }
      });
    } else {
      console.log(`Целевой пользователь ${targetUserId} не найден для передачи ICE-кандидата`);
      // Уведомляем отправителя о проблеме
      socket.emit('ice-error', {
        message: 'ICE candidate could not be delivered - target user not found',
        targetUserId,
        candidate: {
          type: candidate?.type,
          protocol: candidate?.protocol
        }
      });
    }
  });
  
  socket.on('call-end', ({ targetUserId }) => {
    const callerData = usersInfo.get(socket.userId);
    
    console.log(`\n=== Завершение звонка ===`, {
      endedBy: {
        id: socket.userId,
        login: callerData?.login
      },
      targetUserId,
      time: new Date().toISOString()
    });
    
    const targetSocketId = userSockets.get(targetUserId);
    if (targetSocketId) {
      io.to(targetSocketId).emit('call-ended', {
        endedBy: socket.userId,
        endedByInfo: {
          login: callerData?.login
        }
      });
    }
  });

  // Обработка отмены звонка (когда звонящий отменяет до ответа)
  socket.on('call-canceled', ({ targetUserId }) => {
    const callerData = usersInfo.get(socket.userId);
    
    console.log(`\n=== Отмена звонка ===`, {
      canceledBy: {
        id: socket.userId,
        login: callerData?.login
      },
      targetUserId,
      time: new Date().toISOString()
    });
    
    const targetSocketId = userSockets.get(targetUserId);
    if (targetSocketId) {
      io.to(targetSocketId).emit('call-canceled', {
        callerId: socket.userId,
        callerInfo: {
          login: callerData?.login
        }
      });
    }
  });

  // Метод для запроса информации о соединении
  socket.on('get-connection-info', ({ targetUserId }, callback) => {
    const targetData = usersInfo.get(targetUserId);
    const response = {
      yourInfo: usersInfo.get(socket.userId),
      targetInfo: targetData,
      targetOnline: userSockets.has(targetUserId),
      allConnections: Array.from(userSockets.entries()).map(([id, socketId]) => ({
        userId: id,
        socketId,
        ...(usersInfo.get(id) || {})
      }))
    };
    
    console.log(`\n=== Запрос информации о соединении ===`, {
      requester: socket.userId,
      target: targetUserId,
      response: {
        ...response,
        allConnections: `${response.allConnections.length} записей`
      }
    });
    
    if (typeof callback === 'function') {
      callback(response);
    }
  });

  // Добавляем обработчик состояния соединения
  socket.on('connection-state', ({ targetUserId, state }) => {
    const senderData = usersInfo.get(socket.userId);
    const targetSocketId = userSockets.get(targetUserId);
    
    console.log(`\n=== Connection State Update ===`, {
      from: {
        id: socket.userId,
        login: senderData?.login
      },
      to: {
        id: targetUserId
      },
      state
    });
    
    if (targetSocketId) {
      io.to(targetSocketId).emit('connection-state-update', {
        state,
        fromUserId: socket.userId,
        fromUserInfo: {
          login: senderData?.login
        }
      });
    }
  });

  // Добавляем обработчик ошибок медиапотока
  socket.on('media-error', ({ targetUserId, error }) => {
    const senderData = usersInfo.get(socket.userId);
    const targetSocketId = userSockets.get(targetUserId);
    
    console.log(`\n=== Media Error ===`, {
      from: {
        id: socket.userId,
        login: senderData?.login
      },
      error
    });
    
    if (targetSocketId) {
      io.to(targetSocketId).emit('media-error-received', {
        error,
        fromUserId: socket.userId,
        fromUserInfo: {
          login: senderData?.login
        }
      });
    }
  });

  // Добавляем обработчик для рестарта ICE
  socket.on('ice-restart', ({ targetUserId }) => {
    const senderData = usersInfo.get(socket.userId);
    const targetSocketId = userSockets.get(targetUserId);
    
    console.log(`\n=== ICE Restart Requested ===`, {
      from: {
        id: socket.userId,
        login: senderData?.login
      },
      to: {
        id: targetUserId
      }
    });
    
    if (targetSocketId) {
      io.to(targetSocketId).emit('ice-restart-needed', {
        fromUserId: socket.userId,
        fromUserInfo: {
          login: senderData?.login
        }
      });
    }
  });

  // Добавляем обработчик для проверки соединения
  socket.on('connection-test', ({ targetUserId }) => {
    const senderData = usersInfo.get(socket.userId);
    const targetSocketId = userSockets.get(targetUserId);
    
    console.log(`\n=== Connection Test ===`, {
      from: {
        id: socket.userId,
        login: senderData?.login
      },
      to: {
        id: targetUserId
      }
    });
    
    if (targetSocketId) {
      io.to(targetSocketId).emit('connection-test-request', {
        fromUserId: socket.userId
      });
    }
  });

  socket.on('connection-test-response', ({ targetUserId }) => {
    const targetSocketId = userSockets.get(targetUserId);
    if (targetSocketId) {
      io.to(targetSocketId).emit('connection-test-result', {
        success: true,
        timestamp: Date.now()
      });
    }
  });

  // Обработчик запроса списка онлайн пользователей
  socket.on('get-online-users', () => {
    socket.emit('online-users', Array.from(onlineUsers));
  });

  // Обработчик отправки сообщения
  socket.on('send-message', async (data) => {
    try {
      // Поддержка вложенного объекта message
      const msg = data.message || data;

      console.log('\n=== [SOCKET] Получен send-message ===');
      console.log('data:', JSON.stringify(data, null, 2));
      console.log('content:', msg.content);
      console.log('text:', msg.text);
      console.log('files:', msg.files);

      if (
        (!msg.content && !msg.text) &&
        (!msg.files || msg.files.length === 0)
      ) {
        console.log('[SOCKET] Пропущено пустое сообщение');
        return;
      }

      const message = {
        id: msg.id || data.messageId,
        content: msg.content,
        text: msg.text,
        sent_at: msg.sent_at || new Date().toISOString(),
        sender_id: msg.sender_id || socket.userId,
        chat_id: msg.chat_id || data.chatId,
        type: msg.type || data.type || 'text',
        files: msg.files || [],
        fileName: msg.fileName || data.fileName,
        fileSize: msg.fileSize || data.fileSize
      };
      console.log('[SOCKET] Итоговый message для new-message:', JSON.stringify(message, null, 2));

      const receiverSocketId = userSockets.get(data.receiverId || msg.receiverId);

      if (receiverSocketId) {
        io.to(receiverSocketId).emit('new-message', { message });
      }
      io.to(socket.id).emit('new-message', { message });

      socket.emit('message-sent', {
        messageId: message.id,
        chatId: message.chat_id,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Ошибка при обработке сообщения:', error);
      socket.emit('message-error', {
        messageId: data.messageId,
        error: 'Failed to process message'
      });
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = {
  io,
  userSockets,
  usersInfo
};