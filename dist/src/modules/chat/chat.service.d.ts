import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { TokenService } from '../usage/token.service';
import type { Response } from 'express';
import { StreamMessageDto } from './dto/stream-message.dto';
export declare class ChatService {
    private readonly prisma;
    private readonly tokenService;
    private readonly config;
    private readonly provider;
    constructor(prisma: PrismaService, tokenService: TokenService, config: ConfigService);
    streamChat(conversationId: string, userId: string, dto: StreamMessageDto, res: Response): Promise<void>;
}
