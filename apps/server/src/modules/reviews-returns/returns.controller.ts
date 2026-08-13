import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ReturnsService } from './returns.service';
import { CreateReturnRequestDto } from './dto/create-return-request.dto';
import { UpdateReturnStatusDto } from './dto/update-return-status.dto';

@Controller('returns')
export class ReturnsController {
  constructor(private readonly returnsService: ReturnsService) {}

  @Post()
  createReturnRequest(@Body() dto: CreateReturnRequestDto) {
    return this.returnsService.createReturnRequest(dto);
  }

  @Get()
  findAll() {
    return this.returnsService.findAll();
  }

  @Get('user/:userId')
  findByUser(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.returnsService.findByUser(userId);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.returnsService.findOne(id);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateReturnStatusDto,
  ) {
    return this.returnsService.updateStatus(id, dto);
  }
}
