import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import { MembershipService } from './membership.service';
import { UpdateMembershipDto } from './dto/membership.dto';

@Controller('membership')
export class MembershipController {
  constructor(private membershipService: MembershipService) {}

  @Get()
  findAll() {
    return this.membershipService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.membershipService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateMembershipDto) {
    return this.membershipService.update(id, dto);
  }
}
