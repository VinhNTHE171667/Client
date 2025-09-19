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
}
