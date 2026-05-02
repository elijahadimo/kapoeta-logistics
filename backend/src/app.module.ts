import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { BranchesModule } from './branches/branches.module';
import { ShipmentsModule } from './shipments/shipments.module';
import { TripsModule } from './trips/trips.module';
import { UploadModule } from './upload/upload.module';
import { CrewModule } from './crew/crew.module';
import { LocationGateway } from './gateways/location.gateway';
import { AuditModule } from './audit/audit.module';
import { User } from './entities/user.entity';
import { Branch } from './entities/branch.entity';
import { Shipment } from './entities/shipment.entity';
import { Trip } from './entities/trip.entity';
import { Incident } from './entities/incident.entity';
import { Feedback } from './entities/feedback.entity';
import { Message } from './entities/message.entity';
import { FuelLog } from './entities/fuel-log.entity';
import { Notification } from './entities/notification.entity';
import { Waybill } from './entities/waybill.entity';
import { Crew } from './entities/crew.entity';
import { AuditLog } from './entities/audit.entity';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_DATABASE'),
        entities: [User, Branch, Shipment, Trip, Incident, Feedback, Message, FuelLog, Notification, Waybill, Crew, AuditLog],
        synchronize: true,
        logging: true,
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    AuthModule,
    BranchesModule,
    ShipmentsModule,
    TripsModule,
    UploadModule,
    CrewModule,
    AuditModule,
  ],
  controllers: [AppController],
  providers: [AppService, LocationGateway],
})
export class AppModule {}
