import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Trip, TripStatus, RouteType } from '../entities/trip.entity';
import { ShipmentsService } from '../shipments/shipments.service';
import { BranchesService } from '../branches/branches.service';
import { Shipment } from '../entities/shipment.entity';

@Injectable()
export class TripsService {
  constructor(
    @InjectRepository(Trip)
    private tripRepository: Repository<Trip>,
    private shipmentsService: ShipmentsService,
    private branchesService: BranchesService,
  ) {}

  private getRouteOrder(): string[] {
    return ['Nairobi', 'Nadapal', 'Narus', 'Kapoeta', 'Torit', 'Juba'];
  }

  async create(tripData: any): Promise<Trip> {
    const tripNumber = 'TRP-' + Date.now();
    
    const newTrip = this.tripRepository.create({
      tripNumber: tripNumber,
      truckPlate: tripData.truckPlate,
      driverId: tripData.driverId,
      asstDriverId: tripData.asstDriverId || null,
      route: tripData.route,
      departureBranchId: tripData.departureBranchId,
      arrivalBranchId: tripData.arrivalBranchId,
      departureTime: tripData.departureTime || new Date(),
      estimatedArrival: tripData.estimatedArrival,
      status: TripStatus.PLANNED,
      waypoints: [],
      maxWeight: tripData.maxWeight || 1000,
      maxItems: tripData.maxItems || 50,
      currentWeight: 0,
      currentItems: 0,
      currentStopIndex: 0,
    });
    
    const savedTrip = await this.tripRepository.save(newTrip);
    
    if (tripData.shipmentIds && tripData.shipmentIds.length > 0) {
      for (const shipmentId of tripData.shipmentIds) {
        const shipment = await this.shipmentsService.findOne(shipmentId);
        await this.addShipmentToTrip(shipmentId, savedTrip.id, shipment.weight);
      }
    }
    
    return savedTrip;
  }

  async createFromLoadedShipments(
    departureBranchId: string,
    arrivalBranchId: string,
    truckPlate: string,
    driverId: string,
    shipmentIds: string[],
    maxWeight?: number,
    maxItems?: number
  ): Promise<Trip> {
    const tripNumber = 'TRP-' + Date.now();
    
    const departureBranch = await this.branchesService.findOne(departureBranchId);
    
    const shipments: Shipment[] = [];
    let totalWeight = 0;
    for (const shipmentId of shipmentIds) {
      const shipment = await this.shipmentsService.findOne(shipmentId);
      shipments.push(shipment);
      totalWeight += shipment.weight;
    }
    
    const uniqueDestinations = [...new Set(shipments.map(s => s.destinationBranch?.name || ''))];
    const routeOrder = this.getRouteOrder();
    const sortedDestinations = uniqueDestinations.filter(d => d).sort((a, b) => {
      return routeOrder.indexOf(a) - routeOrder.indexOf(b);
    });
    
    const finalDestination = sortedDestinations[sortedDestinations.length - 1];
    const finalBranch = await this.branchesService.findByName(finalDestination);
    
    const waypoints = sortedDestinations.map(destName => {
      const shipmentsForStop = shipments.filter(s => s.destinationBranch?.name === destName);
      return {
        branchName: destName,
        shipmentCount: shipmentsForStop.length,
        shipments: shipmentsForStop.map(s => ({
          id: s.id,
          trackingNumber: s.trackingNumber,
          receiverName: s.receiverName,
          weight: s.weight
        }))
      };
    });
    
    const newTrip = this.tripRepository.create({
      tripNumber: tripNumber,
      truckPlate: truckPlate,
      driverId: driverId,
      route: `${departureBranch.name.toLowerCase()}_to_${finalDestination?.toLowerCase() || 'destination'}` as RouteType,
      departureBranchId: departureBranchId,
      arrivalBranchId: finalBranch ? finalBranch.id : arrivalBranchId,
      departureTime: new Date(),
      status: TripStatus.PLANNED,
      waypoints: waypoints,
      maxWeight: maxWeight || 1000,
      maxItems: maxItems || 50,
      currentWeight: totalWeight,
      currentItems: shipmentIds.length,
      currentStopIndex: 0,
    });
    
    const savedTrip = await this.tripRepository.save(newTrip);
    
    for (const shipmentId of shipmentIds) {
      await this.shipmentsService.assignToTrip(shipmentId, savedTrip.id);
    }
    
    return savedTrip;
  }

  async addShipmentToTrip(shipmentId: string, tripId: string, weight: number): Promise<Trip> {
    const trip = await this.findOne(tripId);
    const shipment = await this.shipmentsService.findOne(shipmentId);
    
    // Check capacity
    if (trip.currentWeight + weight > trip.maxWeight) {
      throw new BadRequestException(`Weight capacity exceeded. Available: ${trip.maxWeight - trip.currentWeight}kg`);
    }
    
    if (trip.currentItems + 1 > trip.maxItems) {
      throw new BadRequestException(`Item capacity exceeded. Available: ${trip.maxItems - trip.currentItems} items`);
    }
    
    // Check if shipment destination is along the route
    const destinationName = shipment.destinationBranch?.name;
    const waypoints = trip.waypoints || [];
    const currentStopIndex = trip.currentStopIndex || 0;
    
    const destinationIndex = waypoints.findIndex(w => w.branchName === destinationName);
    if (destinationIndex !== -1 && destinationIndex < currentStopIndex) {
      throw new BadRequestException(`Cannot add: Vehicle has already passed ${destinationName}`);
    }
    
    trip.currentWeight += weight;
    trip.currentItems += 1;
    
    // Update waypoints
    if (destinationIndex !== -1) {
      const waypoint = waypoints[destinationIndex];
      waypoint.shipmentCount += 1;
      waypoint.shipments.push({
        id: shipment.id,
        trackingNumber: shipment.trackingNumber,
        receiverName: shipment.receiverName,
        weight: shipment.weight
      });
      trip.waypoints = waypoints;
    }
    
    await this.shipmentsService.assignToTrip(shipmentId, tripId);
    return await this.tripRepository.save(trip);
  }

  async getAvailableTransitVehicles(branchId: string): Promise<Trip[]> {
    const branch = await this.branchesService.findOne(branchId);
    const branchName = branch.name;
    
    const allTrips = await this.tripRepository.find({
      where: { status: TripStatus.IN_TRANSIT },
      relations: ['driver', 'departureBranch', 'arrivalBranch'],
    });
    
    return allTrips.filter(trip => {
      const waypoints = trip.waypoints || [];
      const currentStopIndex = trip.currentStopIndex || 0;
      const futureStops = waypoints.slice(currentStopIndex);
      return futureStops.some(stop => stop.branchName === branchName);
    });
  }

  async findAll(): Promise<Trip[]> {
    return await this.tripRepository.find({
      relations: ['driver', 'asstDriver', 'departureBranch', 'arrivalBranch'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Trip> {
    const trip = await this.tripRepository.findOne({
      where: { id },
      relations: ['driver', 'asstDriver', 'departureBranch', 'arrivalBranch'],
    });
    
    if (!trip) {
      throw new NotFoundException(`Trip with ID ${id} not found`);
    }
    
    return trip;
  }

  async updateStatus(id: string, status: TripStatus): Promise<Trip> {
    const trip = await this.findOne(id);
    trip.status = status;
    if (status === TripStatus.COMPLETED) {
      trip.completedAt = new Date();
    }
    if (status === TripStatus.IN_TRANSIT && trip.currentStopIndex === undefined) {
      trip.currentStopIndex = 0;
    }
    return await this.tripRepository.save(trip);
  }

  async updateLocation(id: string, latitude: number, longitude: number): Promise<Trip> {
    const trip = await this.findOne(id);
    trip.currentLatitude = latitude;
    trip.currentLongitude = longitude;
    trip.lastLocationUpdate = new Date();
    return await this.tripRepository.save(trip);
  }

  async advanceToNextStop(id: string): Promise<Trip> {
    const trip = await this.findOne(id);
    const waypoints = trip.waypoints || [];
    const currentStopIndex = trip.currentStopIndex || 0;
    
    if (currentStopIndex < waypoints.length - 1) {
      trip.currentStopIndex = currentStopIndex + 1;
    }
    
    return await this.tripRepository.save(trip);
  }
}
