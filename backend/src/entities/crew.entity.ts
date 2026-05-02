import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

export enum CrewType {
  LOADING = 'loading',
  UNLOADING = 'unloading',
}

export enum PaymentType {
  BULK = 'bulk',
  INDIVIDUAL = 'individual',
}

export enum PaymentStatus {
  PAID = 'paid',
  PENDING = 'pending',
  PARTIAL = 'partial',
}

@Entity('crews')
export class Crew {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  tripId: string;

  @Column({ nullable: true })
  shipmentId: string;

  @Column({ type: 'enum', enum: CrewType })
  type: CrewType;

  @Column()
  name: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ default: 'loader' })
  role: string;

  @Column({ default: false })
  agreementSigned: boolean;

  @Column({ type: 'enum', enum: PaymentType, default: PaymentType.INDIVIDUAL })
  paymentType: PaymentType;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  amount: number;

  @Column({ default: 'KES' })
  currency: string;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  paymentStatus: PaymentStatus;

  @CreateDateColumn()
  createdAt: Date;
}
