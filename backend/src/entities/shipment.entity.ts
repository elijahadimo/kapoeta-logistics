import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Branch } from './branch.entity';
import { User } from './user.entity';
import { Trip } from './trip.entity';

export enum ShipmentStatus {
  PENDING = 'pending',
  LOADED = 'loaded',
  IN_TRANSIT = 'in_transit',
  ARRIVED = 'arrived',
  DELIVERED = 'delivered',
  LOST = 'lost',
  DAMAGED = 'damaged',
}

export enum PaymentMethod {
  PREPAID = 'prepaid',
  COD = 'cod',
  PARTIAL = 'partial',
}

export enum Currency {
  KES = 'KES',
  SSP = 'SSP',
  USD = 'USD',
}

@Entity('shipments')
export class Shipment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  trackingNumber: string;

  @Column({ nullable: true })
  qrCode: string;

  @Column()
  senderName: string;

  @Column()
  senderPhone: string;

  @Column({ nullable: true })
  senderEmail: string;

  @Column()
  receiverName: string;

  @Column()
  receiverPhone: string;

  @Column({ nullable: true })
  receiverEmail: string;

  @Column()
  itemDescription: string;

  @Column('decimal', { precision: 10, scale: 2 })
  weight: number;

  @Column({ nullable: true })
  itemCategory: string;

  @Column({ default: false })
  isFragile: boolean;

  @Column({ default: false })
  isHazardous: boolean;

  @Column({ nullable: true })
  specialInstructions: string;

  @Column()
  originBranchId: string;

  @ManyToOne(() => Branch)
  @JoinColumn({ name: 'originBranchId' })
  originBranch: Branch;

  @Column()
  destinationBranchId: string;

  @ManyToOne(() => Branch)
  @JoinColumn({ name: 'destinationBranchId' })
  destinationBranch: Branch;

  @Column('decimal', { precision: 10, scale: 2 })
  shippingCost: number;

  @Column({ type: 'enum', enum: Currency, default: Currency.KES })
  currency: Currency;

  @Column({ type: 'enum', enum: PaymentMethod, default: PaymentMethod.PREPAID })
  paymentMethod: PaymentMethod;

  @Column({ type: 'enum', enum: ShipmentStatus, default: ShipmentStatus.PENDING })
  status: ShipmentStatus;

  @Column({ nullable: true })
  codAmount: number;

  @Column({ nullable: true })
  codPaidAmount: number;

  @Column({ nullable: true })
  balanceDue: number;

  @Column('text', { array: true, nullable: true })
  photos: string[];

  @Column({ nullable: true })
  currentLocation: string;

  @Column({ nullable: true })
  loadedBy: string;

  @Column({ nullable: true })
  deliveredBy: string;

  @Column({ nullable: true })
  deliveredAt: Date;

  @Column({ nullable: true })
  receiverSignature: string;

  @Column()
  createdBy: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdBy' })
  creator: User;

  @Column('decimal', { precision: 10, scale: 2, nullable: true, default: 0 })
  loadingFee: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true, default: 0 })
  unloadingFee: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true, default: 0 })
  handlingFee: number;

  @Column({ nullable: true })
  tripId: string;

  @ManyToOne(() => Trip)
  @JoinColumn({ name: 'tripId' })
  trip: Trip;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
