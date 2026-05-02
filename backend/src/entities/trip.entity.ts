import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { Branch } from './branch.entity';

export enum TripStatus {
  PLANNED = 'planned',
  IN_TRANSIT = 'in_transit',
  COMPLETED = 'completed',
  DELAYED = 'delayed',
  CANCELLED = 'cancelled',
}

export enum RouteType {
  NAIROBI_JUBA = 'nairobi_juba',
  JUBA_NAIROBI = 'juba_nairobi',
  NAIROBI_KAPOETA = 'nairobi_kapoeta',
  KAPOETA_JUBA = 'kapoeta_juba',
  NAIROBI_NADAPAL = 'nairobi_nadapal',
  NADAPAL_NARUS = 'nadapal_narus',
  NARUS_KAPOETA = 'narus_kapoeta',
  KAPOETA_TORIT = 'kapoeta_torit',
  TORIT_JUBA = 'torit_juba',
}

@Entity('trips')
export class Trip {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  tripNumber: string;

  @Column()
  truckPlate: string;

  @Column({ nullable: true })
  driverId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'driverId' })
  driver: User;

  @Column({ nullable: true })
  asstDriverId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'asstDriverId' })
  asstDriver: User;

  @Column({ type: 'enum', enum: RouteType, nullable: true })
  route: RouteType;

  @Column()
  departureBranchId: string;

  @ManyToOne(() => Branch)
  @JoinColumn({ name: 'departureBranchId' })
  departureBranch: Branch;

  @Column()
  arrivalBranchId: string;

  @ManyToOne(() => Branch)
  @JoinColumn({ name: 'arrivalBranchId' })
  arrivalBranch: Branch;

  @Column({ nullable: true })
  departureTime: Date;

  @Column({ nullable: true })
  estimatedArrival: Date;

  @Column({ nullable: true })
  actualArrival: Date;

  @Column({ type: 'enum', enum: TripStatus, default: TripStatus.PLANNED })
  status: TripStatus;

  @Column('decimal', { precision: 10, scale: 7, nullable: true })
  currentLatitude: number;

  @Column('decimal', { precision: 10, scale: 7, nullable: true })
  currentLongitude: number;

  @Column({ nullable: true })
  lastLocationUpdate: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  completedAt: Date;

  @Column('json', { nullable: true })
  waypoints: any;

  // Capacity fields
  @Column('decimal', { precision: 10, scale: 2, nullable: true, default: 1000 })
  maxWeight: number;

  @Column('int', { nullable: true, default: 50 })
  maxItems: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  currentWeight: number;

  @Column('int', { default: 0 })
  currentItems: number;

  // Track current position in route
  @Column('int', { default: 0 })
  currentStopIndex: number;
}

  // Location tracking fields (already exist, verify)
  // currentLatitude, currentLongitude, lastLocationUpdate already present
