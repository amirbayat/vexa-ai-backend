import { PrismaService } from '../../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
export declare class UsersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    updateMe(userId: string, dto: UpdateUserDto): Promise<{
        message: "پروفایل با موفقیت به‌روز شد";
        user: {
            id: string;
            phone: string;
            name: string | null;
            role: import("@prisma/client").$Enums.Role;
        };
    }>;
}
