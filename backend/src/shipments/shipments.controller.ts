import { Controller, Get, Post, Put, Body, Param, Query, Request } from '@nestjs/common';
import { ShipmentsService } from './shipments.service';
import { Shipment, ShipmentStatus } from '../entities/shipment.entity';

@Controller('shipments')
export class ShipmentsController {
  constructor(private readonly shipmentsService: ShipmentsService) {}

  @Post()
  async create(@Body() shipmentData: Partial<Shipment>, @Request() req: any) {
    const userId = req.headers['user-id'] || req.body.userId || 'system';
    return await this.shipmentsService.create(shipmentData, userId);
  }

  @Get()
  async findAll(@Query('role') role: string, @Query('branchId') branchId: string) {
    if (branchId) {
      return await this.shipmentsService.getShipmentsByBranch(branchId);
    }
    return await this.shipmentsService.findAll();
  }

  @Get('loaded-for-dispatch/:branchId')
  async getLoadedForDispatch(@Param('branchId') branchId: string) {
    return await this.shipmentsService.getLoadedShipmentsForDispatch(branchId);
  }

  @Get('track/:trackingNumber')
  async findByTrackingNumber(@Param('trackingNumber') trackingNumber: string) {
    return await this.shipmentsService.findByTrackingNumber(trackingNumber);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.shipmentsService.findOne(id);
  }

  @Put(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: ShipmentStatus,
    @Body('userId') userId: string,
  ) {
    return await this.shipmentsService.updateStatus(id, status, userId);
  }

  @Put(':id/assign-trip')
  async assignToTrip(
    @Param('id') id: string,
    @Body('tripId') tripId: string,
  ) {
    return await this.shipmentsService.assignToTrip(id, tripId);
  }

  @Put(':id/location')
  async updateLocation(
    @Param('id') id: string,
    @Body('location') location: string,
  ) {
    return await this.shipmentsService.updateLocation(id, location);
  }

  @Put(':id/payment')
  async recordPayment(
    @Param('id') id: string,
    @Body('amount') amount: number,
  ) {
    return await this.shipmentsService.recordPayment(id, amount);
  }

  @Post(':id/photos')
  async addPhoto(
    @Param('id') id: string,
    @Body('photoUrl') photoUrl: string,
  ) {
    return await this.shipmentsService.addPhoto(id, photoUrl);
  }
}
