import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { SupportService } from './support.service';
import { SupportGateway } from './support.gateway';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

// ─── Public endpoints ─────────────────────────────────────────────────────────

@Controller('support')
export class SupportController {
  constructor(
    private readonly supportService: SupportService,
    private readonly supportGateway: SupportGateway,
  ) {}

  // Get active helpline numbers (public)
  @Get('helplines')
  getHelplines() {
    return this.supportService.getHelplines();
  }

  // Get the support contact email shown on the Help page (public)
  @Get('contact-email')
  async getContactEmail() {
    return { email: await this.supportService.getContactEmail() };
  }

  // Start a new chat session (public)
  @Post('chats')
  async startChat(@Body() body: { guestName: string; guestEmail?: string; orderRef?: string }) {
    const chat = await this.supportService.createChat(body.guestName, body.guestEmail, body.orderRef);
    this.supportGateway.broadcastNewChat(chat);
    return chat;
  }

  // Get a specific chat (public — guest uses their chatId)
  @Get('chats/:id')
  getChat(@Param('id') id: string) {
    return this.supportService.getChat(id);
  }
}

// ─── Admin-only endpoints ─────────────────────────────────────────────────────

@Controller('admin/support')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminSupportController {
  constructor(private readonly supportService: SupportService) {}

  // Support contact email
  @Get('contact-email')
  async getContactEmail() {
    return { email: await this.supportService.getContactEmail() };
  }

  @Patch('contact-email')
  updateContactEmail(@Body() body: { email: string }) {
    return this.supportService.updateContactEmail(body.email);
  }

  // Helpline management
  @Get('helplines')
  getAllHelplines() {
    return this.supportService.getAllHelplines();
  }

  @Post('helplines')
  createHelpline(@Body() body: { label: string; number: string; order?: number }) {
    return this.supportService.createHelpline(body);
  }

  @Patch('helplines/:id')
  updateHelpline(
    @Param('id') id: string,
    @Body() body: { label?: string; number?: string; isActive?: boolean; order?: number },
  ) {
    return this.supportService.updateHelpline(id, body);
  }

  @Delete('helplines/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteHelpline(@Param('id') id: string) {
    return this.supportService.deleteHelpline(id);
  }

  // Chat management
  @Get('chats')
  getAllChats() {
    return this.supportService.getAllChats();
  }

  @Patch('chats/:id/close')
  closeChat(@Param('id') id: string) {
    return this.supportService.closeChat(id);
  }
}
