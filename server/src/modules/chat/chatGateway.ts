import { Server as HTTPServer } from 'node:http';
import { Server } from 'socket.io';
import { listMessages, storeMessage } from '../../services/chatService.js';

export function createChatGateway(server: HTTPServer) {
  const io = new Server(server, {
    cors: {
      origin: '*',
    },
  });

  io.on('connection', (socket) => {
    listMessages().then((messages) => socket.emit('history', messages));

    socket.on('message', async (payload: { author: string; message: string; userId?: string }) => {
      if (!payload?.message) return;
      const message = await storeMessage(payload.author ?? 'Convidado', payload.message, payload.userId);
      io.emit('message', message);
    });

    socket.on('typing', (author: string) => {
      socket.broadcast.emit('typing', author);
    });
  });

  return io;
}
