import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common';
import { TripsService } from './trips.service';
import { Trip, TripStatus } from '../entities/trip.entity';

@Controller('trips')
export class TripsController {
  constructor(private readonly tripsService: TripsService) {}

  @Post()
  async create(@Body() tripData: Partial<Trip>) {
    return await this.tripsService.create(tripData);
  }

  @Post('from-loaded')
  async createFromLoadedShipments(
    @Body() body: {
      departureBranchId: string;
      arrivalBranchId: string;
      truckPlate: string;
      driverId: string;
      shipmentIds: string[];
      maxWeight?: number;
      maxItems?: number;
    }
  ) {
    return await this.tripsService.createFromLoadedShipments(
      body.departureBranchId,
      body.arrivalBranchId,
      body.truckPlate,
      body.driverId,
      body.shipmentIds,
      body.maxWeight,
      body.maxItems
    );
  }

  @Post(':tripId/add-shipment/:shipmentId')
  async addShipmentToTrip(
    @Param('tripId') tripId: string,
    @Param('shipmentId') shipmentId: string,
    @Body('weight') weight: number
  ) {
    return await this.tripsService.addShipmentToTrip(shipmentId, tripId, weight);
  }

  @Get('available')
  async getAvailableTransitVehicles(@Query('branchId') branchId: string) {
    return await this.tripsService.getAvailableTransitVehicles(branchId);
  }

  @Get()
  async findAll() {
    return await this.tripsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.tripsService.findOne(id);
  }

  @Put(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: TripStatus,
  ) {
    return await this.tripsService.updateStatus(id, status);
  }

  @Put(':id/location')
  async updateLocation(
    @Param('id') id: string,
    @Body('latitude') latitude: number,
    @Body('longitude') longitude: number,
  ) {
    return await this.tripsService.updateLocation(id, latitude, longitude);
  }

  @Put(':id/next-stop')
  async advanceToNextStop(@Param('id') id: string) {
    return await this.tripsService.advanceToNextStop(id);
  }
}
