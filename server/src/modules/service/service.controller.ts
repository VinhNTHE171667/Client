import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { ServiceService } from './service.service';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiBody } from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { CreateServiceDto, UpdateServiceDto } from './dto/service.dto';

@Controller('service')
export class ServiceController {
  constructor(private servicesService: ServiceService) {}

  @Get('public')
  getPublicServices() {
    return this.servicesService.findPublicServices();
  }

  @Get('public/:id')
  getPublicService(@Param('id') id: string) {
    return this.servicesService.findOnePublicService(id);
  }

  @Get('public/doctor/:id')
  getPublicServiceByDoctor(@Param('id') doctorId: string) {
    return this.servicesService.findServicesByDoctor(doctorId);
  }

  @Post('')
  @UseInterceptors(FilesInterceptor('images', 10, { storage: memoryStorage() }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: CreateServiceDto })
  createService(
    @Body() body: any,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    let doctorsIds: string[] = [];
    if (typeof body.doctorsIds === 'string') {
      try {
        doctorsIds = JSON.parse(body.doctorsIds);
      } catch {
        doctorsIds = [];
      }
    } else if (Array.isArray(body.doctorsIds)) {
      doctorsIds = body.doctorsIds;
    }

    const dto: CreateServiceDto = {
      name: body.name,
      price: Number(body.price),
      description: body.description ?? '',
      categoryId: body.categoryId,
      isActive: body.isActive === 'true',
      doctorsIds: doctorsIds,
    };

    return this.servicesService.createService(dto, files);
  }

  @Get()
  findAllServices() {
    return this.servicesService.findAllServices();
  }

  @Get(':id')
  findOneService(@Param('id') id: string) {
    return this.servicesService.findOneService(id);
  }

  @Put(':id')
  @UseInterceptors(FilesInterceptor('images', 10, { storage: memoryStorage() }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UpdateServiceDto })
  updateService(
    @Param('id') id: string,
    @Body() body: any,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    let doctorsIds: string[] = [];
    if (typeof body.doctorsIds === 'string') {
      try {
        doctorsIds = JSON.parse(body.doctorsIds);
      } catch {
        doctorsIds = [];
      }
    } else if (Array.isArray(body.doctorsIds)) {
      doctorsIds = body.doctorsIds;
    }

    const dto: UpdateServiceDto = {
      name: body.name,
      price: Number(body.price),
      description: body.description ?? '',
      categoryId: body.categoryId,
      isActive: body.isActive === 'true' || body.isActive === true,
      id: id,
      doctorsIds: doctorsIds,
    };

    let deletedImages: string[] = [];
    if (Array.isArray(body.deletedImages)) {
      deletedImages = body.deletedImages;
    } else if (typeof body.deletedImages === 'string') {
      deletedImages = [body.deletedImages];
    }

    return this.servicesService.updateService(id, dto, files, deletedImages);
  }

  @Delete(':id')
  removeService(@Param('id') id: string) {
    return this.servicesService.deleteService(id);
  }

  @Get('doctor/:serviceId')
  findDoctorsByService(@Param('serviceId') serviceId: string) {
    return this.servicesService.findDoctorsByService(serviceId);
  }
}
