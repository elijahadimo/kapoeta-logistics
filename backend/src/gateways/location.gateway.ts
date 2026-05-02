import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: 'http://localhost:5173',
    credentials: true,
  },
})
export class LocationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedDrivers = new Map<string, string>(); // driverId -> socketId
  private driverLocations = new Map<string, any>(); // driverId -> location

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    for (const [driverId, socketId] of this.connectedDrivers.entries()) {
      if (socketId === client.id) {
        this.connectedDrivers.delete(driverId);
        this.driverLocations.delete(driverId);
        console.log(`Driver ${driverId} disconnected`);
        break;
      }
    }
  }

  @SubscribeMessage('driver-register')
  handleDriverRegister(client: Socket, payload: { driverId: string; tripId: string }) {
    this.connectedDrivers.set(payload.driverId, client.id);
    console.log(`Driver ${payload.driverId} registered for trip ${payload.tripId}`);
    
    client.data.driverId = payload.driverId;
    client.data.tripId = payload.tripId;
  }

  @SubscribeMessage('driver-location')
  handleDriverLocation(client: Socket, payload: { 
    driverId: string; 
    tripId: string; 
    latitude: number; 
    longitude: number;
    speed: number;
    heading: number;
  }) {
    const locationData = {
      driverId: payload.driverId,
      tripId: payload.tripId,
      latitude: payload.latitude,
      longitude: payload.longitude,
      speed: payload.speed,
      heading: payload.heading,
      timestamp: new Date().toISOString(),
    };
    
    this.driverLocations.set(payload.driverId, locationData);
    
    this.server.emit(`location-${payload.tripId}`, locationData);
    this.server.emit('fleet-update', locationData);
  }

  @SubscribeMessage('request-fleet-locations')
  handleRequestFleetLocations(client: Socket) {
    const locations = Array.from(this.driverLocations.entries()).map(([driverId, data]) => ({
      driverId,
      tripId: data.tripId,
      latitude: data.latitude,
      longitude: data.longitude,
      speed: data.speed,
      timestamp: data.timestamp,
    }));
    client.emit('fleet-locations', locations);
  }

  @SubscribeMessage('request-vehicle-location')
  handleRequestVehicleLocation(client: Socket, payload: { tripId: string }) {
    for (const [driverId, data] of this.driverLocations.entries()) {
      if (data.tripId === payload.tripId) {
        client.emit(`vehicle-location-${payload.tripId}`, data);
        break;
      }
    }
  }

  getDriverLocation(tripId: string): any {
    for (const [driverId, data] of this.driverLocations.entries()) {
      if (data.tripId === tripId) {
        return data;
      }
    }
    return null;
  }
}
