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

    console.log('doctorsIds', doctorsIds);
    if (doctorsIds.length > 0) {
      const doctors = await this.doctorRepo.findByIds(doctorsIds);

      console.log('doctors', doctors);
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

  async findPublicServices(): Promise<Service[]> {
    const services = await this.serviceRepo.find({
      where: {
        isActive: true,
        deletedAt: IsNull(),
      },
      relations: ['category'],
    });

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

    return result.map((service) => {
      const category = service.category
        ? omit(service.category, [
            'createdAt',
            'updatedAt',
            'deletedAt',
            'isActive',
          ])
        : null;

      service.category = category;

      return omit(service, ['deletedAt', 'createdAt', 'updatedAt', 'isActive']);
    });
  }

  async findOnePublicService(id: string): Promise<Service | null> {
    const service = await this.serviceRepo.findOne({
      where: {
        id,
        deletedAt: IsNull(),
        isActive: true,
      },
      relations: ['category'],
    });

    if (!service) {
      throw new NotFoundException('Không tìm thấy dịch vụ');
    }

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

    const category = service.category
      ? omit(service.category, [
          'createdAt',
          'updatedAt',
          'deletedAt',
          'isActive',
        ])
      : null;

    const result = omit(
      {
        ...service,
        doctors,
      },
      ['deletedAt', 'createdAt', 'updatedAt', 'isActive'],
    );
    result.category = category;

    return result as Service;
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
}
