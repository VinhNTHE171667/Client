import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { RegisterCustomerDto } from './dto/register.dto';
import { AuthService } from './auth.service';
import { LoginDto, RefreshTokenDto } from './dto/login.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiParam, ApiConsumes, ApiBody } from '@nestjs/swagger';
import {
  ChangePasswordDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  UpdateCustomerProfileDto,
} from './dto/customer.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('profile/:id')
  @ApiParam({ name: 'id', type: String })
  findProfile(@Param('id') id: string) {
    return this.authService.findCustomerProfile(id);
  }

  @Patch('profile/:id')
  @ApiParam({ name: 'id', type: String })
  updateProfile(
    @Param('id') id: string,
    @Body() dto: UpdateCustomerProfileDto,
  ) {
    return this.authService.updateCustomerProfile(id, dto);
  }

  @Patch('avatar/:id')
  @ApiParam({ name: 'id', type: String })
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  updateAvatar(
    @Param('profile/:id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Chưa upload file ảnh');
    }
    return this.authService.updateCustomerAvatar(id, file);
  }

  @Patch('change-password/:id')
  @ApiParam({ name: 'id', type: String })
  changePassword(@Param('id') id: string, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(id, dto);
  }

  @Post('login')
  login(@Body() body: LoginDto): Promise<any> {
    return this.authService.login(body);
  }

  @Post('register-customer')
  register(@Body() customer: RegisterCustomerDto): Promise<any> {
    const customerData = {
      ...customer,
      birth_date: customer.birth_date
        ? new Date(customer.birth_date)
        : undefined,
    };
    return this.authService.registerCustomer(customerData);
  }

  @Post('refresh-token')
  refreshToken(@Body() body: RefreshTokenDto): Promise<any> {
    const { refresh_token } = body;
    return this.authService.refreshToken(refresh_token);
  }

  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.newPassword);
  }
}
