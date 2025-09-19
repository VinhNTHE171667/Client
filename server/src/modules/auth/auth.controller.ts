import { Body, Controller, Post } from '@nestjs/common';
import { RegisterCustomerDto } from './dto/register.dto';
import { AuthService } from './auth.service';
import { LoginDto, RefreshTokenDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

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
}
