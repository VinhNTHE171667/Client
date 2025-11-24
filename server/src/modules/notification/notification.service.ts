import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Notification } from '@/entities/notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { Customer } from '@/entities/customer.entity';
import { Doctor } from '@/entities/doctor.entity';
import { Internal } from '@/entities/internal.entity';
import { NotificationType } from '@/entities/enums/notification-type.enum';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,

    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,

    @InjectRepository(Doctor)
    private readonly doctorRepo: Repository<Doctor>,

    @InjectRepository(Internal)
    private readonly internalRepo: Repository<Internal>,
  ) {}

  async create(createNotificationDto: CreateNotificationDto): Promise<Notification> {
    await this.validateUser(createNotificationDto.userId, createNotificationDto.userType);

    const notification = this.notificationRepo.create({
      ...createNotificationDto,
      type: createNotificationDto.type || NotificationType.Info,
      isRead: false,
    });
    return await this.notificationRepo.save(notification);
  }

  async findAllForAdmin(take?: number, skip?: number): Promise<{ notifications: Notification[]; total: number }> {
    const [notifications, total] = await this.notificationRepo.findAndCount({
      where: { deletedAt: IsNull() },
      order: { createdAt: 'DESC' },
      take: take || 10,
      skip: skip || 0,
    });
    return { notifications, total };
  }

  async findByUser(userId: string, userType: string, take?: number, skip?: number): Promise<{ notifications: Notification[]; total: number }> {
    this.validateUserType(userType);
    await this.validateUser(userId, userType);

    const [notifications, total] = await this.notificationRepo.findAndCount({
      where: { 
        userId, 
        userType: userType.toLowerCase(), 
        deletedAt: IsNull() 
      },
      order: { createdAt: 'DESC' },
      take: take || 10,
      skip: skip || 0,
    });
    return { notifications, total };
  }

  async findUnreadByUser(userId: string, userType: string): Promise<Notification[]> {
    this.validateUserType(userType);
    await this.validateUser(userId, userType);

    return await this.notificationRepo.find({
      where: { 
        userId, 
        userType: userType.toLowerCase(), 
        isRead: false, 
        deletedAt: IsNull() 
      },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Notification> {
    const notification = await this.notificationRepo.findOne({
      where: { id, deletedAt: IsNull() },
    });
    if (!notification) {
      throw new NotFoundException('Không tìm thấy thông báo');
    }
    return notification;
  }

  async update(id: string, updateNotificationDto: UpdateNotificationDto): Promise<Notification> {
    const notification = await this.findOne(id);
    Object.assign(notification, updateNotificationDto);
    return await this.notificationRepo.save(notification);
  }

  async markAsRead(id: string): Promise<Notification> {
    return await this.update(id, { isRead: true });
  }

  async markAllAsRead(userId: string, userType: string): Promise<void> {
    this.validateUserType(userType);
    await this.validateUser(userId, userType);

    await this.notificationRepo.update(
      { 
        userId, 
        userType: userType.toLowerCase(), 
        isRead: false, 
        deletedAt: IsNull() 
      },
      { isRead: true },
    );
  }

  async remove(id: string): Promise<{ message: string }> {
    await this.findOne(id);
    await this.notificationRepo.softDelete(id);
    return { message: 'Đã xóa thông báo' };
  }

  private async validateUser(userId: string, userType: string): Promise<boolean> {
    switch (userType.toLowerCase()) {
      case 'customer':
        return !!(await this.customerRepo.findOne({ where: { id: userId } }));
      case 'doctor':
        return !!(await this.doctorRepo.findOne({ where: { id: userId } }));
      case 'internal':
        return !!(await this.internalRepo.findOne({ where: { id: userId } }));
      default:
        throw new BadRequestException('Loại người dùng không hợp lệ');
    }
  }

  private validateUserType(userType: string): void {
    const validTypes = ['customer', 'doctor', 'internal'];
    if (!validTypes.includes(userType.toLowerCase())) {
      throw new BadRequestException('Loại người dùng không hợp lệ');
    }
  }
}