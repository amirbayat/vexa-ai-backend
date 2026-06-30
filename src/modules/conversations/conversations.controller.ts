import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { JwtGuard } from '../../common/guards/jwt.guard'
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator'
import { ConversationsService } from './conversations.service'
import { CreateConversationDto } from './dto/create-conversation.dto'
import { UpdateConversationDto } from './dto/update-conversation.dto'
import { ListConversationsDto } from './dto/list-conversations.dto'
import { fa } from '../../i18n/fa'

@Controller('conversations')
@UseGuards(JwtGuard)
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateConversationDto) {
    return this.conversationsService.create(user.sub, dto)
  }

  @Get()
  findAll(@CurrentUser() user: JwtPayload, @Query() query: ListConversationsDto) {
    return this.conversationsService.findAll(user.sub, query)
  }

  @Get(':id')
  findOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.conversationsService.findOne(id, user.sub)
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateConversationDto,
  ) {
    const conversation = await this.conversationsService.update(id, user.sub, dto)
    return { message: fa.conversations.updated, conversation }
  }

  @Delete(':id')
  @HttpCode(204)
  archive(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.conversationsService.archive(id, user.sub)
  }
}
