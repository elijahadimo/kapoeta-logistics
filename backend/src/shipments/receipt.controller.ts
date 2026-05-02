import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ReceiptService } from './receipt.service';

@Controller('receipts')
export class ReceiptController {
  constructor(private readonly receiptService: ReceiptService) {}

  @Get('sending/:shipmentId')
  async getSendingReceipt(@Param('shipmentId') shipmentId: string) {
    return await this.receiptService.generateSendingReceipt(shipmentId);
  }

  @Get('delivery/:shipmentId')
  async getDeliveryReceipt(@Param('shipmentId') shipmentId: string) {
    return await this.receiptService.generateDeliveryReceipt(shipmentId);
  }
}
