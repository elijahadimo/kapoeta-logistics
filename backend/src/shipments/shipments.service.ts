import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Shipment, ShipmentStatus, PaymentMethod } from '../entities/shipment.entity';
import { BranchesService } from '../branches/branches.service';

@Injectable()
export class ShipmentsService {
  constructor(
    @InjectRepository(Shipment)
    private shipmentRepository: Repository<Shipment>,
    private branchesService: BranchesService,
  ) {}

  private generateTrackingNumber(originBranchCode: string): string {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `KL-${originBranchCode}-${year}-${random}`;
  }

  private getBranchCode(branchName: string): string {
    const codes: Record<string, string> = {
      'Nairobi': 'NAI',
      'Nadapal': 'NAD',
      'Narus': 'NAR',
      'Kapoeta': 'KAP',
      'Torit': 'TOR',
      'Juba': 'JUB',
    };
    return codes[branchName] || 'UNK';
  }

  async create(shipmentData: any, userId: string): Promise<Shipment> {
    const originBranch = await this.branchesService.findOne(shipmentData.originBranchId);
    const branchCode = this.getBranchCode(originBranch.name);
    const trackingNumber = this.generateTrackingNumber(branchCode);
    
    const newShipment = this.shipmentRepository.create({
      senderName: shipmentData.senderName,
      senderPhone: shipmentData.senderPhone,
      senderEmail: shipmentData.senderEmail || null,
      receiverName: shipmentData.receiverName,
      receiverPhone: shipmentData.receiverPhone,
      receiverEmail: shipmentData.receiverEmail || null,
      itemDescription: shipmentData.itemDescription,
      weight: shipmentData.weight,
      originBranchId: shipmentData.originBranchId,
      destinationBranchId: shipmentData.destinationBranchId,
      shippingCost: shipmentData.shippingCost,
      currency: shipmentData.currency || 'KES',
      paymentMethod: shipmentData.paymentMethod || PaymentMethod.PREPAID,
      trackingNumber: trackingNumber,
      createdBy: userId,
      status: ShipmentStatus.PENDING,
      photos: [],
      isFragile: shipmentData.isFragile || false,
      isHazardous: shipmentData.isHazardous || false,
    });
    
    if (shipmentData.paymentMethod === PaymentMethod.COD) {
      newShipment.codAmount = shipmentData.shippingCost;
      newShipment.balanceDue = shipmentData.shippingCost;
    }
    
    if (shipmentData.loadingFee) {
      newShipment.loadingFee = shipmentData.loadingFee;
    }
    
    return await this.shipmentRepository.save(newShipment);
  }

  async findAll(): Promise<Shipment[]> {
    return await this.shipmentRepository.find({
      relations: ['originBranch', 'destinationBranch', 'creator', 'trip'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Shipment> {
    const shipment = await this.shipmentRepository.findOne({
      where: { id },
      relations: ['originBranch', 'destinationBranch', 'creator', 'trip'],
    });
    
    if (!shipment) {
      throw new NotFoundException(`Shipment with ID ${id} not found`);
    }
    return shipment;
  }

  async findByTrackingNumber(trackingNumber: string): Promise<Shipment> {
    const shipment = await this.shipmentRepository.findOne({
      where: { trackingNumber },
      relations: ['originBranch', 'destinationBranch'],
    });
    
    if (!shipment) {
      throw new NotFoundException(`Shipment with tracking number ${trackingNumber} not found`);
    }
    return shipment;
  }

  async updateStatus(id: string, status: ShipmentStatus, userId?: string): Promise<Shipment> {
    const shipment = await this.findOne(id);
    shipment.status = status;
    
    if (status === ShipmentStatus.LOADED && userId) {
      shipment.loadedBy = userId;
    }
    
    if (status === ShipmentStatus.DELIVERED && userId) {
      shipment.deliveredBy = userId;
      shipment.deliveredAt = new Date();
    }
    
    return await this.shipmentRepository.save(shipment);
  }

  async assignToTrip(shipmentId: string, tripId: string): Promise<Shipment> {
    const shipment = await this.findOne(shipmentId);
    shipment.tripId = tripId;
    shipment.status = ShipmentStatus.IN_TRANSIT;
    return await this.shipmentRepository.save(shipment);
  }

  async getLoadedShipmentsForDispatch(originBranchId: string): Promise<Shipment[]> {
    return await this.shipmentRepository.find({
      where: { 
        originBranchId: originBranchId,
        status: ShipmentStatus.LOADED
      },
      relations: ['destinationBranch'],
    });
  }

  async updateLocation(id: string, location: string): Promise<Shipment> {
    const shipment = await this.findOne(id);
    shipment.currentLocation = location;
    return await this.shipmentRepository.save(shipment);
  }

  async recordPayment(id: string, amount: number): Promise<Shipment> {
    const shipment = await this.findOne(id);
    
    if (shipment.paymentMethod !== PaymentMethod.COD) {
      throw new BadRequestException('This shipment is not COD');
    }
    
    const paidSoFar = shipment.codPaidAmount || 0;
    const newPaid = paidSoFar + amount;
    
    shipment.codPaidAmount = newPaid;
    shipment.balanceDue = (shipment.codAmount || 0) - newPaid;
    
    if (shipment.balanceDue < 0) {
      shipment.balanceDue = 0;
    }
    
    return await this.shipmentRepository.save(shipment);
  }

  async addPhoto(id: string, photoUrl: string): Promise<Shipment> {
    const shipment = await this.findOne(id);
    const currentPhotos = shipment.photos || [];
    shipment.photos = [...currentPhotos, photoUrl];
    return await this.shipmentRepository.save(shipment);
  }

  async getShipmentsByBranch(branchId: string): Promise<Shipment[]> {
    return await this.shipmentRepository.find({
      where: [
        { originBranchId: branchId },
        { destinationBranchId: branchId },
      ],
      relations: ['originBranch', 'destinationBranch'],
    });
  }

  async getShipmentsByStatus(status: ShipmentStatus): Promise<Shipment[]> {
    return await this.shipmentRepository.find({
      where: { status },
      relations: ['originBranch', 'destinationBranch'],
    });
  }
}
