import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShipmentsService } from './shipments.service';
import { ShipmentsController } from './shipments.controller';
import { ReceiptModule } from './receipt.module';
import { QRCodeService } from './qrcode.service';
import { QRCodeController } from './qrcode.controller';
import { Shipment } from '../entities/shipment.entity';
import { BranchesModule } from '../branches/branches.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Shipment]),
    BranchesModule,
    ReceiptModule,
  ],
  controllers: [ShipmentsController, QRCodeController],
  providers: [ShipmentsService, QRCodeService],
  exports: [ShipmentsService],
})
export class ShipmentsModule {}
