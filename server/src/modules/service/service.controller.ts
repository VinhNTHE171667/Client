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

  @Post('')
  @UseInterceptors(FilesInterceptor('images', 10, { storage: memoryStorage() }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: CreateServiceDto })
  createService(
    @Body() body: any,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const dto: CreateServiceDto = {
      name: body.name,
      price: Number(body.price),
      description: body.description ?? '',
      categoryId: body.categoryId,
      isActive: body.isActive === 'true',
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
    const dto: UpdateServiceDto = {
      name: body.name,
      price: Number(body.price),
      description: body.description ?? '',
      categoryId: body.categoryId,
      isActive: body.isActive === 'true' || body.isActive === true,
      id: id,
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
}
