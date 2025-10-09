import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';
import logger from '../utils/logger.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

let io;

export const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findByPk(decoded.userId);

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.userId = user.id;
      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', async (socket) => {
    logger.info(`Socket: User connected: ${socket.userId}`);

    await socket.user.update({ status: 'online', lastActivity: new Date() });

    io.emit('user:online', {
      userId: socket.userId,
      status: 'online',
    });

    socket.on('deployment:subscribe', (deploymentId) => {
      socket.join(`deployment-${deploymentId}`);
      logger.info(`Socket: User ${socket.userId} subscribed to deployment ${deploymentId}`);
    });

    socket.on('deployment:unsubscribe', (deploymentId) => {
      socket.leave(`deployment-${deploymentId}`);
      logger.info(`Socket: User ${socket.userId} unsubscribed from deployment ${deploymentId}`);
    });

    socket.on('disconnect', async () => {
      logger.info(`Socket: User disconnected: ${socket.userId}`);

      const user = await User.findByPk(socket.userId);
      if (user) {
        await user.update({ status: 'offline' });

        io.emit('user:offline', {
          userId: socket.userId,
          status: 'offline',
        });
      }
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};
