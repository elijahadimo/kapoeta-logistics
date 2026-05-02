import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { CrewService } from './crew.service';
import { Crew } from '../entities/crew.entity';

@Controller('crew')
export class CrewController {
  constructor(private readonly crewService: CrewService) {}

  @Post()
  async create(@Body() crewData: Partial<Crew>) {
    return await this.crewService.create(crewData);
  }

  @Post('batch')
  async createMultiple(@Body() crewList: Partial<Crew>[]) {
    return await this.crewService.createMultiple(crewList);
  }

  @Get('trip/:tripId')
  async findByTrip(@Param('tripId') tripId: string, @Query('type') type: string) {
    return await this.crewService.findByTrip(tripId, type);
  }

  @Get('shipment/:shipmentId')
  async findByShipment(@Param('shipmentId') shipmentId: string, @Query('type') type: string) {
    return await this.crewService.findByShipment(shipmentId, type);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() crewData: Partial<Crew>) {
    return await this.crewService.update(id, crewData);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return await this.crewService.delete(id);
  }
}
