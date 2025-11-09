import { Category } from '@/entities/category.entity';
import { Service } from '@/entities/service.entity';
import { cloudinary } from '@/utils/cloudinary';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { UpdateServiceDto } from './dto/service.dto';
import omit from 'lodash/omit';
import { Console } from 'console';
import { Doctor } from '@/entities/doctor.entity';
import { FeedbackStatus } from '@/entities/enums/feedback-status';

@Injectable()
export class ServiceService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,

    @InjectRepository(Service)
    private readonly serviceRepo: Repository<Service>,

    @InjectRepository(Doctor)
    private readonly doctorRepo: Repository<Doctor>,
  ) {}

  async createService(dto: any, files: Express.Multer.File[]) {
    const images = files?.length
      ? await this.uploadImagesToCloudinary(files)
      : [];

    const doctorsIds = Array.isArray(dto.doctorsIds) ? dto.doctorsIds : [];

    if (doctorsIds.length > 0) {
      const doctors = await this.doctorRepo.findByIds(doctorsIds);
      dto.doctors = doctors;
    }

    const service = this.serviceRepo.create({ ...dto, images });

    return this.serviceRepo.save(service);
  }

  async findAllServices(): Promise<Service[] | null> {
    const services = await this.serviceRepo.find({
      where: {
        deletedAt: IsNull(),
      },
      relations: ['category'],
    });

    if (!services || services.length === 0) {
      throw new NotFoundException('Không tìm thấy dịch vụ');
    }

    const result = await Promise.all(
      services.map(async (service) => {
        const doctorsRaw = await this.doctorRepo
          .createQueryBuilder('doctor')
          .innerJoin('doctor.services', 'service', 'service.id = :serviceId', {
            serviceId: service.id,
          })
          .where('doctor.deletedAt IS NULL')
          .andWhere('doctor.isActive = :isActive', { isActive: true })
          .getMany();

        const doctors = doctorsRaw.map((d) => ({
          id: d.id,
          name: d.full_name,
          avatar: d.avatar,
        }));

        return {
          ...service,
          doctors,
        };
      }),
    );

    return result as unknown as Service[];
  }

  async findOneService(id: string) {
    const service = await this.serviceRepo.findOne({
      where: { id },
      relations: ['category'],
    });

    if (!service) throw new NotFoundException('Không tìm thấy dịch vụ');

    const doctorsRaw = await this.doctorRepo
      .createQueryBuilder('doctor')
      .innerJoin('doctor.services', 'service', 'service.id = :serviceId', {
        serviceId: service.id,
      })
      .where('doctor.deletedAt IS NULL')
      .andWhere('doctor.isActive = :isActive', { isActive: true })
      .getMany();

    const doctors = doctorsRaw.map((d) => {
      id = d.id;
      return {
        id: d.id,
        name: d.full_name,
        avatar: d.avatar,
      };
    });

    const result = omit(
      {
        ...service,
        doctors,
      },
      ['deletedAt', 'createdAt', 'updatedAt', 'isActive'],
    );

    return result;
  }

  async updateService(
    id: string,
    dto: UpdateServiceDto,
    files?: Express.Multer.File[],
    deletedImages?: string[],
  ) {
    const service = await this.findOneService(id);

    if (deletedImages?.length) {
      service.images = service.images.filter(
        (img) => !deletedImages.includes(img.url),
      );
    }

    if (files?.length) {
      const uploadedImages = await this.uploadImagesToCloudinary(files);
      service.images = [...service.images, ...uploadedImages];
    }

    const doctorsIds = Array.isArray(dto.doctorsIds) ? dto.doctorsIds : [];

    if (doctorsIds.length > 0) {
      const doctors = await this.doctorRepo.findByIds(doctorsIds);

      service.doctors = doctors;
    } else {
      service.doctors = [];
    }

    const isActive =
      typeof dto.isActive === 'string'
        ? dto.isActive === 'true'
        : Boolean(dto.isActive);

    Object.assign(service, { ...dto, isActive });
    return this.serviceRepo.save(service);
  }

  async deleteService(id: string) {
    // console.log('service', id);
    const service = await this.findOneService(id);
    return this.serviceRepo.softRemove(service);
  }

  async uploadImagesToCloudinary(
    files: Express.Multer.File[],
  ): Promise<{ url: string; alt?: string }[]> {
    const uploads = await Promise.all(
      files.map((file) => {
        return new Promise<{ url: string }>((resolve, reject) => {
          cloudinary.uploader
            .upload_stream({ folder: 'services' }, (error, result) => {
              if (error || !result)
                return reject(new Error('Lỗi khi tải lên hình ảnh'));
              resolve({ url: result.secure_url });
            })
            .end(file.buffer);
        });
      }),
    );
    return uploads;
  }

  async findPublicServices(): Promise<any[]> {
    const services = await this.serviceRepo.find({
      where: {
        isActive: true,
        deletedAt: IsNull(),
      },
      relations: ['category', 'feedbacks', 'feedbacks.customer'],
    });

    const serviceFormatted = await Promise.all(
      services.map(async (service) => {
        const feedbacks = service.feedbacks
          .filter((f) => f.status === FeedbackStatus.Approved)
          .map((f) => ({
            rating: f.rating,
            comment: f.comment,
            customer: f.customer
              ? {
                  id: f.customer.id,
                  full_name: f.customer.full_name,
                  avatar: f.customer.avatar,
                }
              : null,
          }));

        const feedbacksCount = feedbacks.length;

        const doctorsRaw = await this.doctorRepo
          .createQueryBuilder('doctor')
          .innerJoin('doctor.services', 'service', 'service.id = :serviceId', {
            serviceId: service.id,
          })
          .where('doctor.deletedAt IS NULL')
          .andWhere('doctor.isActive = :isActive', { isActive: true })
          .getMany();

        const doctors = doctorsRaw.map((d) => ({
          id: d.id,
          name: d.full_name,
          avatar: d.avatar,
          specialization: d.specialization,
          biography: d.biography,
          experience_years: d.experience_years,
        }));

        const category = service.category
          ? {
              id: service.category.id,
              name: service.category.name,
            }
          : null;

        return {
          id: service.id,
          name: service.name,
          price: service.price,
          images: service.images || [],
          description: service.description || '',
          categoryId: service.categoryId,
          category,
          doctors,
          feedbacks,
          feedbacksCount,
        };
      }),
    );

    return serviceFormatted;
  }

  async findOnePublicService(id: string): Promise<any> {
    const service = await this.serviceRepo.findOne({
      where: {
        id,
        deletedAt: IsNull(),
        isActive: true,
      },
      relations: ['category', 'feedbacks', 'feedbacks.customer'],
    });

    if (!service) {
      throw new NotFoundException('Không tìm thấy dịch vụ');
    }

    const feedbacks = service.feedbacks
      .filter((f) => f.status === FeedbackStatus.Approved)
      .map((f) => ({
        rating: f.rating,
        comment: f.comment,
        customer: f.customer
          ? {
              id: f.customer.id,
              full_name: f.customer.full_name,
              avatar: f.customer.avatar,
            }
          : null,
        createdAt: f.createdAt,
      }));

    const feedbacksCount = feedbacks.length;

    const doctorsRaw = await this.doctorRepo
      .createQueryBuilder('doctor')
      .innerJoin('doctor.services', 'service', 'service.id = :serviceId', {
        serviceId: service.id,
      })
      .where('doctor.deletedAt IS NULL')
      .andWhere('doctor.isActive = :isActive', { isActive: true })
      .getMany();

    const doctors = doctorsRaw.map((d) => ({
      id: d.id,
      name: d.full_name,
      avatar: d.avatar,
      specialization: d.specialization,
      biography: d.biography,
      experience_years: d.experience_years,
    }));

    const category = service.category
      ? {
          id: service.category.id,
          name: service.category.name,
        }
      : null;

    const result = {
      id: service.id,
      name: service.name,
      price: service.price,
      images: service.images || [],
      description: service.description || '',
      categoryId: service.categoryId,
      category,
      doctors,
      feedbacks,
      feedbacksCount,
    };

    return result;
  }

  async findDoctorsByService(serviceId: string): Promise<Doctor[]> {
    const service = await this.findOneService(serviceId);

    const doctors = await this.doctorRepo
      .createQueryBuilder('doctor')
      .innerJoin('doctor.services', 'service', 'service.id = :serviceId', {
        serviceId: service.id,
      })
      .where('doctor.deletedAt IS NULL')
      .andWhere('doctor.isActive = :isActive', { isActive: true })
      .getMany();

    if (!doctors || doctors.length === 0) {
      throw new NotFoundException('Không tìm thấy bác sĩ cho dịch vụ này');
    }

    return doctors;
  }

  async findServicesByDoctor(doctorId: string): Promise<Service[]> {
    const doctor = await this.doctorRepo.findOne({
      where: { id: doctorId, deletedAt: IsNull(), isActive: true },
      relations: ['services'],
    });

    if (!doctor) {
      throw new NotFoundException(`Không tìm thấy bác sĩ với id ${doctorId}`);
    }

    if (!doctor.services || doctor.services.length === 0) {
      throw new NotFoundException('Bác sĩ này chưa có dịch vụ nào');
    }

    return doctor.services;
  }
}
