import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { QRCodeService } from './qrcode.service';

@Controller('qrcode')
export class QRCodeController {
  constructor(private readonly qrCodeService: QRCodeService) {}

  @Get('generate/:shipmentId')
  async generateQRCode(@Param('shipmentId') shipmentId: string) {
    try {
      const qrCode = await this.qrCodeService.generateQRCode(shipmentId);
      return { success: true, qrCode };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  @Get(':shipmentId')
  async getQRCode(@Param('shipmentId') shipmentId: string) {
    try {
      const qrCode = await this.qrCodeService.getQRCode(shipmentId);
      return { success: true, qrCode };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}
