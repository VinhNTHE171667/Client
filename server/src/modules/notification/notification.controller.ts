import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post()
  create(@Body() createNotificationDto: CreateNotificationDto) {
    return this.notificationService.create(createNotificationDto);
  }

  @Get()
  findAll(
    @Query('take') take?: string,
    @Query('skip') skip?: string,
  ) {
    return this.notificationService.findAllForAdmin(
      +(take ?? 10),
      +(skip ?? 0),
    );
  }

  @Get('users/:userId')
  findByUser(
    @Param('userId') userId: string,
    @Query('userType') userType: string,
    @Query('take') take?: string,
    @Query('skip') skip?: string,
  ) {
    return this.notificationService.findByUser(
      userId,
      userType,
      +(take ?? 10),
      +(skip ?? 0),
    );
  }

  @Get('users/:userId/unread')
  findUnreadByUser(
    @Param('userId') userId: string,
    @Query('userType') userType: string,
  ) {
    return this.notificationService.findUnreadByUser(userId, userType);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.notificationService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateNotificationDto: UpdateNotificationDto,
  ) {
    return this.notificationService.update(id, updateNotificationDto);
  }

  @Post(':id/read')
  markAsRead(@Param('id', ParseUUIDPipe) id: string) {
    return this.notificationService.markAsRead(id);
  }

  @Post('users/:userId/read-all')
  markAllAsRead(
    @Param('userId') userId: string,
    @Query('userType') userType: string,
  ) {
    return this.notificationService.markAllAsRead(userId, userType);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.notificationService.remove(id);
  }
}