import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog, AuditAction } from '../entities/audit.entity';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private auditRepository: Repository<AuditLog>,
  ) {}

  async log(
    userId: string,
    userName: string,
    userRole: string,
    action: AuditAction,
    entity: string,
    entityId?: string,
    description?: string,
    ipAddress?: string,
  ): Promise<AuditLog> {
    const log = this.auditRepository.create({
      userId,
      userName,
      userRole,
      action,
      entity,
      entityId,
      description,
      ipAddress,
    });
    return await this.auditRepository.save(log);
  }

  async findAll(): Promise<AuditLog[]> {
    return await this.auditRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findByUser(userId: string): Promise<AuditLog[]> {
    return await this.auditRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findByAction(action: AuditAction): Promise<AuditLog[]> {
    return await this.auditRepository.find({
      where: { action },
      order: { createdAt: 'DESC' },
    });
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<AuditLog[]> {
    return await this.auditRepository.createQueryBuilder('audit')
      .where('audit.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .orderBy('audit.createdAt', 'DESC')
      .getMany();
  }
}
