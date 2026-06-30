import { PrismaService } from '../../prisma/prisma.service';
export declare class AdminService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getDashboard(): Promise<{
        totalUsers: number;
        activeUsers: number;
        totalRevenue: number;
        mrr: number;
        totalConversations: number;
        todayConversations: number;
    }>;
    getUsers(page: number, limit: number, search?: string): Promise<{
        users: {
            subscription: {
                plan: {
                    name: string;
                };
                status: import("@prisma/client").$Enums.SubscriptionStatus;
                periodEnd: Date;
            } | null;
            id: string;
            phone: string;
            name: string | null;
            role: import("@prisma/client").$Enums.Role;
            isActive: boolean;
            createdAt: Date;
        }[];
        total: number;
        page: number;
        limit: number;
    }>;
    updateUser(userId: string, data: {
        isActive?: boolean;
        role?: 'USER' | 'ADMIN';
    }): Promise<{
        message: "کاربر به‌روز شد";
        user: {
            id: string;
            phone: string;
            name: string | null;
            role: import("@prisma/client").$Enums.Role;
            isActive: boolean;
        };
    }>;
    getTokenStats(): Promise<{
        today: {
            totalFree: number;
            totalPaid: number;
            requests: number;
        };
        thisMonth: {
            totalFree: number;
            totalPaid: number;
        };
    }>;
    getRevenueStats(): Promise<{
        month: string;
        revenue: number;
        count: number;
    }[]>;
}
