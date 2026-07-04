import type { Request } from 'express';
import { SalesService } from './sales.service';
import { SalesChatDto, SaveLeadDto } from './dto/sales-chat.dto';
export declare class SalesController {
    private readonly salesService;
    constructor(salesService: SalesService);
    chat(dto: SalesChatDto, req: Request): Promise<{
        reply: string;
        isDone: boolean;
        recommendedPlan?: string;
    }>;
    saveLead(dto: SaveLeadDto): Promise<{
        id: string;
    }>;
}
