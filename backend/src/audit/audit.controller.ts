import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service';
import { AuditAction } from '../entities/audit.entity';

@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  async findAll() {
    return await this.auditService.findAll();
  }

  @Get('user')
  async findByUser(@Query('userId') userId: string) {
    return await this.auditService.findByUser(userId);
  }

  @Get('action')
  async findByAction(@Query('action') action: AuditAction) {
    return await this.auditService.findByAction(action);
  }

  @Get('date-range')
  async findByDateRange(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return await this.auditService.findByDateRange(new Date(startDate), new Date(endDate));
  }
}
