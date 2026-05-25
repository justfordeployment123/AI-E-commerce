import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SupportService } from './support.service';

@WebSocketGateway({
  namespace: '/support',
  cors: { origin: '*', credentials: true },
})
export class SupportGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server!: Server;

  constructor(private readonly supportService: SupportService) {}

  handleConnection(client: Socket) {
    console.log(`[Support] Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`[Support] Client disconnected: ${client.id}`);
  }

  // Customer joins their own chat room
  @SubscribeMessage('joinChat')
  async handleJoinChat(
    @MessageBody() chatId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`chat:${chatId}`);
    try {
      const chat = await this.supportService.getChat(chatId);
      client.emit('chatHistory', chat);
    } catch {
      client.emit('error', { message: 'Chat not found' });
    }
  }

  // Admin joins all chats room
  @SubscribeMessage('joinAdmin')
  handleJoinAdmin(@ConnectedSocket() client: Socket) {
    client.join('admin');
    client.emit('joined', { role: 'admin' });
  }

  // Customer or admin sends a message
  @SubscribeMessage('sendMessage')
  async handleMessage(
    @MessageBody() data: { chatId: string; sender: 'customer' | 'admin'; body: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (!data.body?.trim()) return;

    const message = await this.supportService.addMessage(
      data.chatId,
      data.sender,
      data.body.trim(),
    );

    // Broadcast to all sockets in the chat room
    this.server.to(`chat:${data.chatId}`).emit('newMessage', message);
    // Also notify admin room
    this.server.to('admin').emit('newMessage', { ...message, chatId: data.chatId });
  }

  // Admin closes a chat
  @SubscribeMessage('closeChat')
  async handleCloseChat(@MessageBody() chatId: string) {
    const chat = await this.supportService.closeChat(chatId);
    this.server.to(`chat:${chatId}`).emit('chatClosed', chat);
    this.server.to('admin').emit('chatClosed', chat);
  }

  // Broadcast new chat notification to admin
  broadcastNewChat(chat: any) {
    this.server.to('admin').emit('newChat', chat);
  }
}
