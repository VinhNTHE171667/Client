import { Category } from '@/entities/category.entity';
import { Service } from '@/entities/service.entity';
import { cloudinary } from '@/utils/cloudinary';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { UpdateServiceDto } from './dto/service.dto';
import omit from 'lodash/omit';
import { Console } from 'console';

@Injectable()
export class ServiceService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,

    @InjectRepository(Service)
    private readonly serviceRepo: Repository<Service>,
  ) {}

  async createService(dto: any, files: Express.Multer.File[]) {
    const images = files?.length
      ? await this.uploadImagesToCloudinary(files)
      : [];
    const service = this.serviceRepo.create({ ...dto, images });

    return this.serviceRepo.save(service);
  }

  async findAllServices(): Promise<Service[]> {
    const services = await this.serviceRepo.find({
      where: {
        deletedAt: IsNull(),
      },
      relations: ['category'],
    });

    return services;
  }

  async findOneService(id: string) {
    const service = await this.serviceRepo.findOne({
      where: { id },
      relations: ['category'],
    });

    if (!service) throw new NotFoundException('Không tìm thấy dịch vụ');

    return service;
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

    return services.map((service) => {
      const category = service.category
        ? omit(service.category, [
            'createdAt',
            'updatedAt',
            'deletedAt',
            'isActive',
          ])
        : null;

      service.category = category;

      return omit(service, [
        'deletedAt',
        'createdAt',
        'updatedAt',
        'isActive',
        // 'description',
      ]);
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

    const category = service.category
      ? omit(service.category, [
          'createdAt',
          'updatedAt',
          'deletedAt',
          'isActive',
        ])
      : null;

    const result = omit(service, [
      'deletedAt',
      'createdAt',
      'updatedAt',
      'isActive',
    ]);
    result.category = category;

    return result as Service;
  }
}
