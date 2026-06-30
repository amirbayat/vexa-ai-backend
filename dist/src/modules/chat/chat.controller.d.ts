import type { Response } from 'express';
import { JwtPayload } from '../../common/decorators/current-user.decorator';
import { ChatService } from './chat.service';
import { StreamMessageDto } from './dto/stream-message.dto';
export declare class ChatController {
    private readonly chatService;
    constructor(chatService: ChatService);
    stream(conversationId: string, dto: StreamMessageDto, user: JwtPayload, res: Response): Promise<void>;
}
