import { Injectable } from '@nestjs/common';
import * as QRCode from 'qrcode';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Shipment } from '../entities/shipment.entity';

@Injectable()
export class QRCodeService {
  constructor(
    @InjectRepository(Shipment)
    private shipmentRepository: Repository<Shipment>,
  ) {}

  async generateQRCode(shipmentId: string): Promise<string> {
    try {
      const shipment = await this.shipmentRepository.findOne({
        where: { id: shipmentId },
        relations: ['originBranch', 'destinationBranch'],
      });

      if (!shipment) {
        throw new Error('Shipment not found');
      }

      const qrData = {
        trackingNumber: shipment.trackingNumber,
        senderName: shipment.senderName,
        receiverName: shipment.receiverName,
        originBranch: shipment.originBranch?.name || 'Unknown',
        destinationBranch: shipment.destinationBranch?.name || 'Unknown',
        weight: shipment.weight,
        status: shipment.status,
        url: `http://localhost:5173/track/${shipment.trackingNumber}`
      };

      const qrCodeUrl = await QRCode.toDataURL(JSON.stringify(qrData));
      
      // Save QR code URL to shipment
      shipment.qrCode = qrCodeUrl;
      await this.shipmentRepository.save(shipment);
      
      return qrCodeUrl;
    } catch (error) {
      console.error('QR Code generation error:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  async getQRCode(shipmentId: string): Promise<string> {
    const shipment = await this.shipmentRepository.findOne({ where: { id: shipmentId } });
    if (!shipment) {
      throw new Error('Shipment not found');
    }
    if (!shipment.qrCode) {
      return await this.generateQRCode(shipmentId);
    }
    return shipment.qrCode;
  }
}
