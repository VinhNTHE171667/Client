/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  CreateCustomerDto,
  UpdateCustomerDto,
  UpdatePasswordDto,
} from './dto/customer.dto';
import { AccountService } from './account.service';
import { CreateInternalDto, UpdateInternalDto } from './dto/internal.dto';
import { ApiQuery } from '@nestjs/swagger';

@Controller('account')
export class AccountController {
  constructor(private accountService: AccountService) {}

  @Post('create-customer')
  create(@Body() dto: CreateCustomerDto) {
    return this.accountService.createCustomer(dto);
  }

  // @UseGuards(AuthGuard, RolesGuard)
  // @Auth(RoleEnum.Admin)
  @Get('customers')
  findAll() {
    return this.accountService.findAllCustomers();
  }

  @Get('customer/:id')
  findOne(@Param('id') id: string) {
    return this.accountService.findOneCustomer(id);
  }

  @Patch('customer/:id')
  update(@Param('id') id: string, @Body() dto: UpdateCustomerDto) {
    return this.accountService.updateCustomer(id, dto);
  }

  @Delete('customer/:id')
  remove(@Param('id') id: string) {
    return this.accountService.removeCustomer(id);
  }

  @Patch('customers/:id/active')
  toggleActive(@Param('id') id: string) {
    return this.accountService.toggleCustomerActive(id);
  }

  @Post('update-customer-password')
  updateCustomerPassword(@Body() dto: UpdatePasswordDto) {
    return this.accountService.updateCustomerPassword(dto);
  }

  @Post('create-internal')
  createInternal(@Body() dto: CreateInternalDto) {
    return this.accountService.createInternal(dto);
  }

  @Get('internals')
  findAllInternals() {
    return this.accountService.findAllInternals();
  }

  @Get('internals/:id')
  findOneInternal(@Param('id') id: string) {
    return this.accountService.findOneInternal(id);
  }

  @Patch('internals/:id')
  updateInternal(@Param('id') id: string, @Body() dto: UpdateInternalDto) {
    return this.accountService.updateInternal(id, dto);
  }

  @Delete('internals/:id')
  removeInternal(@Param('id') id: string) {
    return this.accountService.removeInternal(id);
  }

  @Get('internals/roles/all')
  findAllInternalRoles() {
    return this.accountService.findAllInternalRoles();
  }

  @Patch('internals/:id/active')
  toggleInternalActive(@Param('id') id: string) {
    return this.accountService.toggleInternalActive(id);
  }

  @Post('update-internal-password')
  updateInternalPassword(@Body() dto: UpdatePasswordDto) {
    return this.accountService.updateInternalPassword(dto);
  }
}
