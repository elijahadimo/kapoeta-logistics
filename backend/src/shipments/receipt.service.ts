import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Shipment } from '../entities/shipment.entity';
import { Branch } from '../entities/branch.entity';

@Injectable()
export class ReceiptService {
  constructor(
    @InjectRepository(Shipment)
    private shipmentRepository: Repository<Shipment>,
    @InjectRepository(Branch)
    private branchRepository: Repository<Branch>,
  ) {}

  async generateSendingReceipt(shipmentId: string): Promise<any> {
    const shipment = await this.shipmentRepository.findOne({
      where: { id: shipmentId },
      relations: ['originBranch', 'destinationBranch'],
    });

    if (!shipment) {
      throw new Error('Shipment not found');
    }

    return {
      receiptType: 'SENDING_RECEIPT',
      receiptNumber: `SEND-${shipment.trackingNumber}`,
      date: new Date().toISOString(),
      trackingNumber: shipment.trackingNumber,
      senderName: shipment.senderName,
      senderPhone: shipment.senderPhone,
      receiverName: shipment.receiverName,
      receiverPhone: shipment.receiverPhone,
      originBranch: shipment.originBranch.name,
      destinationBranch: shipment.destinationBranch.name,
      itemDescription: shipment.itemDescription,
      weight: shipment.weight,
      shippingCost: shipment.shippingCost,
      currency: shipment.currency,
      paymentMethod: shipment.paymentMethod,
      loadingFee: shipment.loadingFee || 0,
      totalPaid: shipment.shippingCost + (shipment.loadingFee || 0),
      message: 'Thank you for choosing Kapoeta Logistics. Your item has been received and will be delivered soon.'
    };
  }

  async generateDeliveryReceipt(shipmentId: string): Promise<any> {
    const shipment = await this.shipmentRepository.findOne({
      where: { id: shipmentId },
      relations: ['originBranch', 'destinationBranch'],
    });

    if (!shipment) {
      throw new Error('Shipment not found');
    }

    return {
      receiptType: 'DELIVERY_RECEIPT',
      receiptNumber: `DEL-${shipment.trackingNumber}`,
      date: new Date().toISOString(),
      trackingNumber: shipment.trackingNumber,
      senderName: shipment.senderName,
      receiverName: shipment.receiverName,
      receiverPhone: shipment.receiverPhone,
      originBranch: shipment.originBranch.name,
      destinationBranch: shipment.destinationBranch.name,
      itemDescription: shipment.itemDescription,
      weight: shipment.weight,
      shippingCost: shipment.shippingCost,
      currency: shipment.currency,
      paymentMethod: shipment.paymentMethod,
      codAmountCollected: shipment.paymentMethod === 'cod' ? shipment.shippingCost : 0,
      unloadingFee: shipment.unloadingFee || 0,
      totalPaid: (shipment.paymentMethod === 'cod' ? shipment.shippingCost : 0) + (shipment.unloadingFee || 0),
      deliveredAt: shipment.deliveredAt || new Date().toISOString(),
      deliveredBy: shipment.deliveredBy || 'Agent',
      message: 'Thank you for using Kapoeta Logistics. Your item has been delivered successfully.'
    };
  }
}
