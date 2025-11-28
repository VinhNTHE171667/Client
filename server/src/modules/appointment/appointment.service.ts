import { Appointment } from '@/entities/appointment.entity';
import { AppointmentDetail } from '@/entities/appointmentDetails.entity';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm/dist/common/typeorm.decorators';
import { In, Repository, Not, MoreThan, DataSource, Between } from 'typeorm';
import {
  CreateAppointmentDto,
  UpdateAppointmentDto,
} from './appointment/appointment.dto';
import { Service } from '@/entities/service.entity';
import { AppointmentHanle, AppointmentStatus } from '@/entities/enums/appointment-status';
import { MailService } from '../mail/mail.service';
import { Spa } from '@/entities/spa.entity';
import { Internal } from '@/entities/internal.entity';
import { Cart } from '@/entities/cart.entity';
import { CartDetail } from '@/entities/cartDetails.entity';
import { Voucher } from '@/entities/voucher.entity';
import { CustomerVoucher } from '@/entities/customerVoucher.entity';
import { Invoice } from '@/entities/invoice.entity';
import { InvoiceDetail } from '@/entities/invoiceDetail.entity';
import { DoctorCancelRequest } from '@/entities/doctorCancelRequest.entity';
import { NotificationType } from '@/entities/enums/notification-type.enum';
import { NotificationService } from '../notification/notification.service';
import { VoucherService } from '../voucher/voucher.service';

@Injectable()
export class AppointmentService {
  private spaInfo: Spa | null = null;
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepo: Repository<Appointment>,

    @InjectRepository(AppointmentDetail)
    private readonly detailRepo: Repository<AppointmentDetail>,

    @InjectRepository(Service)
    private readonly serviceRepo: Repository<Service>,

    @InjectRepository(Spa)
    private readonly spaRepo: Repository<Spa>,

    @InjectRepository(Internal)
    private readonly internalRepo: Repository<Internal>,

    @InjectRepository(Cart)
    private readonly cartRepo: Repository<Cart>,

    @InjectRepository(CartDetail)
    private readonly cartDetailRepo: Repository<CartDetail>,

    @InjectRepository(Voucher)
    private readonly voucherRepo: Repository<Voucher>,

    @InjectRepository(CustomerVoucher)
    private readonly customerVoucherRepo: Repository<CustomerVoucher>,

    @InjectRepository(Invoice)
    private readonly invoiceRepo: Repository<Invoice>,
    @InjectRepository(InvoiceDetail)
    private readonly invoiceDetailRepo: Repository<InvoiceDetail>,

    @InjectRepository(DoctorCancelRequest)
    private readonly cancelRepo: Repository<DoctorCancelRequest>,

    private readonly mailService: MailService,
    private readonly dataSource: DataSource,

    private readonly notificationService: NotificationService, 
    private readonly voucherService: VoucherService
  ) {
    this.loadSpa();
  }

  private async loadSpa() {
    this.spaInfo = await this.spaRepo.findOne({ where: {} });
    // console.log('Spa info cached:', this.spaInfo?.name);
  }

  private async getSpa(): Promise<Spa | null> {
    if (!this.spaInfo) {
      this.spaInfo = await this.spaRepo.findOne({});
    }
    return this.spaInfo;
  }

  async findAll() {
    const appointments = await this.appointmentRepo.find({
      relations: ['customer', 'doctor', 'details', 'details.service', 'voucher'],
      order: { createdAt: 'DESC' },
    });
    return appointments;
  }

  findAllAppointmentsManaged(doctorId: string) {
    return this.appointmentRepo.find({
      where: { doctorId },
      relations: ['customer', 'doctor', 'details', 'details.service'],
      order: { createdAt: 'DESC' },
    });
  }

  async findAllAppointmentsBooked(doctorId: string) {
    const now = new Date();

    return this.appointmentRepo.find({
      where: {
        doctorId,
        status: Not(AppointmentStatus.Cancelled),
        appointment_date: MoreThan(now),
      },
      select: ['id', 'startTime', 'endTime', 'status'],
      order: { createdAt: 'DESC' },
    });
  }

  async findAllAppointmentsBookedByCustomer(customerId: string) {
    const now = new Date();
    return this.appointmentRepo.find({
      where: {
        customerId,
        status: Not(AppointmentStatus.Cancelled || AppointmentStatus.Rejected),
        appointment_date: MoreThan(now),
      },
      select: ['id', 'startTime', 'endTime', 'status'],
      order: { createdAt: 'DESC' },
    });
  }

  findByCustomer(customerId: string) {
    return this.appointmentRepo.find({
      where: { customerId },
      relations: ['customer', 'doctor', 'details', 'details.service', 'voucher'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    const appointment = await this.appointmentRepo.findOne({
      where: { id },
      relations: ['customer', 'doctor', 'details', 'details.service'],
    });
    if (!appointment) throw new NotFoundException('Không tìm thấy lịch hẹn');
    return appointment;
  }

  async create(dto: CreateAppointmentDto) {
    const serviceIds = dto.details.map((d) => d.serviceId);
    const services = await this.serviceRepo.findBy({ id: In(serviceIds) });

    if (services.length !== serviceIds.length) {
      throw new BadRequestException('Một hoặc nhiều dịch vụ không hợp lệ');
    }

    const subtotal = services.reduce((sum, s) => sum + s.price, 0);
    let totalAmount = subtotal;

    let appliedVoucher: Voucher | null = null;

    if (dto.voucherId) {
      const voucher = await this.voucherRepo.findOne({
        where: { id: dto.voucherId },
      });
      if (!voucher) throw new BadRequestException('Voucher không tồn tại');

      const now = new Date();
      if (voucher.validTo && voucher.validTo < now)
        throw new BadRequestException('Voucher đã hết hạn');

      const customerVoucher = await this.customerVoucherRepo.findOne({
        where: {
          customerId: dto.customerId,
          voucherId: dto.voucherId,
          isUsed: false,
        },
      });
      if (!customerVoucher)
        throw new BadRequestException('Voucher không hợp lệ cho khách hàng');

      appliedVoucher = voucher;

      let discount = 0;
      if (voucher.discountAmount && voucher.discountAmount > 0) {
        discount = voucher.discountAmount;
      } else if (voucher.discountPercent && voucher.discountPercent > 0) {
        discount = (voucher.discountPercent / 100) * subtotal;
      }

      if (voucher.maxDiscount && voucher.maxDiscount > 0) {
        discount = Math.min(discount, voucher.maxDiscount);
      }

      discount = Math.min(discount, subtotal);

      totalAmount = subtotal - discount;

      await this.customerVoucherRepo.update(customerVoucher.id, {
        isUsed: true,
        usedAt: new Date(),
      });
    }

    if (dto.membershipDiscount && dto.membershipDiscount > 0) {
      const membershipReduction = (dto.membershipDiscount / 100) * totalAmount;
      totalAmount -= membershipReduction;
    }

    totalAmount = Math.max(0, Math.round(totalAmount));

    const appointment = this.appointmentRepo.create({
      ...dto,
      status: AppointmentStatus.Pending,
      details: dto.details.map((d) => ({ ...d })),
      totalAmount,
    });

    if (appliedVoucher) appointment.voucher = appliedVoucher;

    const cart = await this.cartRepo.findOne({
      where: { customerId: dto.customerId },
      relations: ['details'],
    });


    if (cart && cart.details?.length) {
     const deleteConditions = dto.details.map((d) => {
        const cond: any = {
          cartId: cart.id,
          serviceId: d.serviceId,
        };

        if (dto.doctorId) {
          cond.doctorId = dto.doctorId;
        }

      return cond;
    });


      await this.cartDetailRepo.delete(deleteConditions);

      const remaining = await this.cartDetailRepo.count({
        where: { cartId: cart.id },
      });
      if (remaining === 0) await this.cartRepo.delete(cart.id);
    }

    const saved = await this.appointmentRepo.save(appointment);
    return this.findOne(saved.id);
  }

  async update(id: string, dto: UpdateAppointmentDto) {
    const original = await this.appointmentRepo.findOne({
      where: { id },
      relations: ['details'],
    });

    if (!original) {
      throw new NotFoundException('Lịch hẹn không tồn tại');
    }

    // if (original.status !== AppointmentStatus.Pending) {
    //   throw new BadRequestException('Không thể cập nhật lịch hẹn đã xác nhận');
    // }

    Object.assign(original, dto);

    return await this.dataSource.transaction(async (manager) => {
      const appointmentRepo = manager.getRepository(Appointment);
      const detailRepo = manager.getRepository(AppointmentDetail);
      const serviceRepo = manager.getRepository(Service);

      const managedAppointment = await appointmentRepo.findOne({
        where: { id },
      });
      if (!managedAppointment) {
        throw new NotFoundException('Lịch hẹn không tồn tại (transaction)');
      }

      await detailRepo
        .createQueryBuilder()
        .delete()
        .from(AppointmentDetail)
        .where('appointmentId = :id', { id })
        .execute();

      if (dto.details && dto.details.length) {
        const newDetails: AppointmentDetail[] = [];
        for (const d of dto.details) {
          const service = await serviceRepo.findOne({
            where: { id: d.serviceId },
          });
          if (!service) {
            throw new BadRequestException(
              `Dịch vụ với ID ${d.serviceId} không tồn tại`,
            );
          }

          const price = d.price ?? service.price ?? 0;

          const detail = detailRepo.create({
            ...d,
            price,
            service,
            appointment: managedAppointment,
          });
          newDetails.push(detail);
        }

        await detailRepo.save(newDetails);
      }

      Object.assign(managedAppointment, {
        ...dto,
        details: undefined,
        totalAmount: dto.totalAmount,
      });

      return await appointmentRepo.save(managedAppointment);
    });
  }

  async reschedule(id: string, newDate: Date) {
    const appointment = await this.findOne(id);
    appointment.appointment_date = newDate;
    await this.appointmentRepo.save(appointment);
    return appointment;
  }

  async confirmAppointment(id: string, staffId: string) {
    const appointment = await this.findOne(id);
    appointment.status = AppointmentStatus.Confirmed;
    const staff = await this.internalRepo.findOne({ where: { id: staffId } });

    appointment.staff = staff as Internal;
    appointment.staffId = staffId;

    if (!staff) {
      throw new NotFoundException('Nhân viên không tồn tại');
    }

    const spa = await this.getSpa();

    const services = appointment.details.map((d) => ({
      name: d.service.name,
      price: d.price ?? d.service.price ?? 0,
    }));

    const servicesWithFormat = services.map((s) => ({
      name: s.name,
      price: new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
      }).format(Number(s.price)),
    }));

    this.mailService.confirmAppointment({
      to: appointment.customer.email,
      text: `Xác nhận lịch hẹn tại GenSpa`,
      appointment: {
        customer: { full_name: appointment.customer.full_name },
        startTime: appointment.startTime,
        services: servicesWithFormat,
        staff: { name: staff.full_name },
        address: spa?.address || 'Đang cập nhật',
      },
    });

    await this.appointmentRepo.save(appointment);

    return appointment;
  }

  // async DepositedAppointment(id: string) {
  //   const appointment = await this.findOne(id);
  //   appointment.status = AppointmentStatus.Deposited;
  //   const staff = await this.internalRepo.findOne({
  //     where: { id: appointment.staffId },
  //   });

  //   if (!staff) {
  //     throw new NotFoundException('Nhân viên không tồn tại');
  //   }

  //   const services = appointment.details.map((d) => ({
  //     name: d.service.name,
  //     price: d.price ?? d.service.price ?? 0,
  //   }));

  //   const servicesWithFormat = services.map((s) => ({
  //     name: s.name,
  //     price: new Intl.NumberFormat('vi-VN', {
  //       style: 'currency',
  //       currency: 'VND',
  //     }).format(Number(s.price)),
  //   }));
  //   const spa = await this.getSpa();

  //   await this.mailService.confirmAppointmentDeposit({
  //     to: appointment.customer.email,
  //     text: 'Xác nhận đặt cọc lịch hẹn',
  //     appointment: {
  //       customer: { full_name: appointment.customer.full_name },
  //       startTime: appointment.startTime,
  //       services: servicesWithFormat,
  //       staff: { full_name: staff.full_name },
  //       address: spa?.address || 'Đang cập nhật',
  //       depositAmount: new Intl.NumberFormat('vi-VN', {
  //         style: 'currency',
  //         currency: 'VND',
  //       }).format(Number(appointment.depositAmount)),
  //     },
  //   });

  //   await this.appointmentRepo.save(appointment);
  //   return appointment;
  // }

  async updateStatus(id: string, status: Appointment['status']) {
    const appointment = await this.findOne(id);
    appointment.status = status;
    await this.appointmentRepo.save(appointment);
    return appointment;
  }

    async cancel(id: string, reason: string) {
    const appointment = await this.findOne(id);

    appointment.status = AppointmentStatus.Cancelled;
    appointment.cancelledAt = new Date();
    appointment.cancelReason = reason;

    if (appointment.voucherId) {
      const customerVoucher = await this.customerVoucherRepo.findOne({
        where: {
          customerId: appointment.customerId,
          voucherId: appointment.voucherId,
          isUsed: true,
        },
      });

      if (customerVoucher) {
        customerVoucher.isUsed = false;
        customerVoucher.usedAt = undefined;
        await this.customerVoucherRepo.save(customerVoucher);
      }
    }

    await this.appointmentRepo.save(appointment);
    return appointment;
  }


  async reject(id: string, reason: string) {
    const appointment = await this.findOne(id);
    appointment.status = AppointmentStatus.Rejected;
    appointment.rejectionReason = reason;
    await this.appointmentRepo.save(appointment);

    
    return appointment;
  }

  async remove(id: string) {
    const appointment = await this.findOne(id);
    await this.appointmentRepo.softRemove(appointment);
    return { message: 'Đã xoá lịch hẹn' };
  }

 async getDashboard({ year, month }: { year: number; month?: number }) {
  const isFullYear = !month || month === 0;

  const startDate = isFullYear
    ? new Date(year, 0, 1)
    : new Date(year, month - 1, 1);

  const endDate = isFullYear
    ? new Date(year + 1, 0, 1) 
    : new Date(year, month, 1);

  const validStatuses = [
    AppointmentStatus.Confirmed,
    AppointmentStatus.Deposited,
    AppointmentStatus.Approved,
    AppointmentStatus.Paid,
    AppointmentStatus.Completed,
    AppointmentStatus.Overdue,
  ];

  const appointments = await this.appointmentRepo.find({
    where: {
      createdAt: Between(startDate, endDate),
      status: In(validStatuses),
    },
    relations: ['customer', 'details', 'details.service'],
    select: {
      id: true,
      totalAmount: true,
      depositAmount: true,
      status: true,
      customer: { id: true, full_name: true },
      details: {
        quantity: true,
        service: { id: true, name: true },
      },
    },
  });




  let expectedRevenue = 0;    
  let actualRevenue = 0;     
  let totalDeposited = 0;    
  let completedAppointments = 0;

  const serviceMap = new Map<string, number>();
  const customerMap = new Map<string, number>();
  const customerIds = new Set<string>();

  appointments.forEach((appt) => {
    const total = Number(appt.totalAmount || 0);
    const deposit = Number(appt.depositAmount || 0);

    // Doanh thu dự kiến
    expectedRevenue += total;

    // Doanh thu thực nhận
    if ([AppointmentStatus.Paid, AppointmentStatus.Completed].includes(appt.status)) {
      actualRevenue += total;
      completedAppointments++;
    } else {
      actualRevenue += deposit;
    }

    totalDeposited += deposit;

    // Top dịch vụ
    appt.details?.forEach((item) => {
      if (item.service?.name) {
        const prev = serviceMap.get(item.service.name) || 0;
        serviceMap.set(item.service.name, prev + item.quantity);
      }
    });

    // Top khách hàng (theo số đơn)
    const name = appt.customer?.full_name || 'Khách lẻ';
    customerMap.set(name, (customerMap.get(name) || 0) + 1);

    // Đếm khách duy nhất
    if (appt.customer?.id) {
      customerIds.add(appt.customer.id);
    }
  });

  const totalAppointments = appointments.length;
  const completionRate = totalAppointments > 0 
    ? Number(((completedAppointments / totalAppointments) * 100).toFixed(1)) 
    : 0;

  const topServices = Array.from(serviceMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const topCustomers = Array.from(customerMap.entries())
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  // === TRẢ VỀ GIỐNG HỆT CŨ + THÊM THÊM MỚI ===
  return {
    totalInvoices: totalAppointments,           // Đổi tên logic: giờ là tổng đơn đặt lịch
    totalAmount: actualRevenue,                  // Doanh thu thực nhận (như cũ là tiền đã vào tay)
    totalCustomers: customerIds.size,
    totalServices: appointments.flatMap(a => a.details || []).length, // tổng dịch vụ đã đặt (nếu cần)

    expectedRevenue,         // MỚI: doanh thu dự kiến
    actualRevenue,           // Đã có ở trên, nhưng để rõ ràng
    totalDeposited,           // MỚI: tổng tiền đặt cọc đã nhận
    totalAppointments,       // MỚI: tổng số đơn đặt
    completedAppointments,   // MỚI: số đơn đã thanh toán đủ
    completionRate,          // MỚI: tỷ lệ hoàn thành (%)

    topServices,
    topCustomers,

    invoices: appointments,
  };
}

  async requestCancelByDoctorBulk(
  appointmentIds: string[],
  doctorId: string,
  reason: string,
) {
  if (!appointmentIds.length) {
    throw new BadRequestException('Chưa chọn lịch hẹn nào');
  }

  const results: { appointmentId: string; status: string }[] = [];

  const staffUsers = await this.internalRepo.find({
    where: {
      role: { name: 'staff' }, 
      isActive: true,
    },
    select: ['id', 'full_name', 'email'],
    relations: ['role'], 
  });

  if (staffUsers.length === 0) {
    console.warn('Không có staff nào trong hệ thống để gửi thông báo hủy lịch');
  }

  for (const id of appointmentIds) {
    const appointment = await this.appointmentRepo.findOne({
      where: { id },
      relations: ['customer', 'doctor'], 
    });

    if (!appointment) {
      results.push({ appointmentId: id, status: 'Không tìm thấy lịch hẹn' });
      continue;
    }

    if (appointment.doctorId !== doctorId) {
      results.push({ appointmentId: id, status: 'Không có quyền hủy' });
      continue;
    }

    const existing = await this.cancelRepo.findOne({
      where: { appointmentId: id, doctorId, status: 'pending' },
    });

    if (existing) {
      results.push({ appointmentId: id, status: 'Đã gửi yêu cầu trước đó' });
      continue;
    }

    const request = this.cancelRepo.create({
      appointmentId: id,
      doctorId,
      reason,
      status: 'pending',
    });

    await this.cancelRepo.save(request);

    await this.appointmentRepo.update(id, {
      statusHanle: AppointmentHanle.Pending, 
    });

    if (staffUsers.length > 0) {
      const customerName = appointment.customer?.full_name || 'Khách lẻ';
      const doctorName = appointment.doctor?.full_name || 'Bác sĩ';

      const notificationPromises = staffUsers.map((staff) =>
        this.notificationService.create({
          title: 'Yêu cầu hủy lịch hẹn từ bác sĩ',
          content: `Bác sĩ ${doctorName} yêu cầu hủy lịch hẹn của khách ${customerName} (Mã: #${id.slice(-8).toUpperCase()}). Lý do: ${reason}`,
          type: NotificationType.Warning,
          userId: staff.id,
          userType: 'internal',
          actionUrl: ``, 
          relatedId: request.id, 
          relatedType: 'cancel_request',
        }),
      );

      Promise.allSettled(notificationPromises).catch((err) =>
        console.error('Lỗi khi gửi thông báo cho staff:', err),
      );
    }

    results.push({ appointmentId: id, status: 'Gửi yêu cầu thành công' });
  }

  return results;
}

  async approveRequest(id: string) {
    const req = await this.cancelRepo.findOne({ where: { id } });
    if (!req) throw new NotFoundException('Không tìm thấy request');

    req.status = 'approved';
    await this.cancelRepo.save(req);

    await this.appointmentRepo.update(req.appointmentId, {
      status: AppointmentStatus.Cancelled,
      cancelledAt: new Date(),
      cancelReason: `${req.reason} (Hủy bởi hệ thống sau khi bác sĩ duyệt)`,
      statusHanle: AppointmentHanle.Approved,
    });

    const appointment = await this.findOne(req.appointmentId);

    await this.notificationService.create({
      title: 'Lịch hẹn của bạn đã bị hủy',
      content: `Lịch hẹn của bạn đã bị hủy. Chúng tôi xin lỗi vì sự bất tiện này. Để bù đắp, chúng tôi đã tạo voucher giảm ${appointment.depositAmount} cho bạn. Voucher sẽ được gửi qua email và thông báo.`,
      type: NotificationType.Warning,
      userId: appointment.customer.id,
      userType: 'customer',
      actionUrl: '/customer/orders',
      relatedId: appointment.id,
      relatedType: 'appointment',
    });

    const voucherCode = `CANCEL_${appointment.id.slice(0, 8).toUpperCase()}_${Date.now()}`;
    const createVoucherDto = {
      code: voucherCode,
      description: 'Voucher bù đắp do hủy lịch hẹn',
      discountAmount: appointment.depositAmount,
      validFrom: new Date(),
      validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 
      isActive: true,
      customerIds: [appointment.customer.id], 
    };

    try {
      await this.voucherService.createForCustomers(createVoucherDto);
    } catch (error) {
      console.log(error)
    }

    if (appointment.doctorId) {
        await this.notificationService.create({
          title: 'Yêu cầu hủy lịch đã được duyệt',
          content: `Yêu cầu hủy lịch hẹn của khách ${appointment.customer?.full_name || 'Khách lẻ'} (Mã: #${appointment.id.slice(-8).toUpperCase()}) đã được nhân viên duyệt thành công.`,
          type: NotificationType.Success,
          userId: appointment.doctorId,
          userType: 'doctor',
          actionUrl: '/doctor/orders',
          relatedId: appointment.id,
          relatedType: 'appointment',
        });
    }

    // await this.historyRepo.save({
    //   appointmentId: req.appointmentId,
    //   status: AppointmentStatus.Cancelled,
    //   note: `Doctor requested cancellation: ${req.reason}`,
    // });

    return { message: 'Đã duyệt yêu cầu và hủy appointment.' };
  }

  async rejectRequest(id: string) {
    const req = await this.cancelRepo.findOne({ where: { id } });
      if (!req) throw new NotFoundException('Không tìm thấy request');

      req.status = 'rejected';
      await this.cancelRepo.save(req);

      await this.appointmentRepo.update(req.appointmentId, {
      statusHanle: AppointmentHanle.Rejected, 
    });

  const appointment = await this.findOne(req.appointmentId);

  if (appointment.doctorId) {
    await this.notificationService.create({
      title: 'Yêu cầu hủy lịch bị từ chối',
      content: `Yêu cầu hủy lịch hẹn của khách ${appointment.customer?.full_name || 'Khách lẻ'} (Mã: #${appointment.id.slice(-8).toUpperCase()}) đã bị từ chối. Vui lòng thực hiện đúng lịch hoặc liên hệ quản lý.`,
      type: NotificationType.Error,
      userId: appointment.doctorId,
      userType: 'doctor',
      actionUrl: '/doctor/orders',
      relatedId: appointment.id,
      relatedType: 'appointment',
    });
  }
    return { message: 'Đã từ chối yêu cầu.' };
  }

  async requestCompleteByStaff(appointmentId: string,  staffName: string) {
  const appointment = await this.appointmentRepo.findOne({
    where: { id: appointmentId },
    relations: ['doctor', 'customer'],
  });

  if (!appointment) {
    throw new NotFoundException('Không tìm thấy lịch hẹn');
  }

  if (!appointment.doctorId) {
    throw new BadRequestException('Lịch hẹn chưa được phân bác sĩ');
  }

  appointment.reminderDoctor = 'Hãy hoàn thành đơn hàng này. Yêu cầu bởi nhân viên';

  await this.appointmentRepo.save(appointment);

  await this.notificationService.create({
    title: 'Yêu cầu hoàn thành dịch vụ',
    content: `${staffName} đang yêu cầu bạn hoàn thành dịch vụ cho khách hàng ${appointment.customer?.full_name || 'khách lẻ'} (Mã đơn: #${appointment.id.slice(-8).toUpperCase()})`,
    type: NotificationType.Info,
    userId: appointment.doctorId,
    userType: 'doctor',
    actionUrl: `/doctor/orders/${appointment.id}`,
    relatedId: appointment.id,
    relatedType: 'appointment',
  });

  return {
    success: true,
    message: 'Đã gửi yêu cầu hoàn thành đến bác sĩ',
    appointmentId: appointment.id,
  };
}

  async findAllPending() {
    return this.cancelRepo.find({
      where: { status: 'pending' },
      relations: ['appointment', 'doctor'],
    });
  }
}
