import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReceiptService } from './receipt.service';
import { ReceiptController } from './receipt.controller';
import { Shipment } from '../entities/shipment.entity';
import { Branch } from '../entities/branch.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Shipment, Branch])],
  controllers: [ReceiptController],
  providers: [ReceiptService],
  exports: [ReceiptService],
})
export class ReceiptModule {}
