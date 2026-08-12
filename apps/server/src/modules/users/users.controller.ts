import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  ParseUUIDPipe,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateAddressDto } from './dto/create-address.dto';
import { CreateCustomerProfileDto } from './dto/create-customer-profile.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(id, updateUserDto);
  }

  @Post(':id/addresses')
  addAddress(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() createAddressDto: CreateAddressDto,
  ) {
    return this.usersService.addAddress(id, createAddressDto);
  }

  @Post(':id/profile')
  upsertProfile(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateCustomerProfileDto,
  ) {
    return this.usersService.upsertProfile(id, dto);
  }
}
