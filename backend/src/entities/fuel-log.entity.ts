import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('fuel_logs')
export class FuelLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tripId: string;

  @Column()
  vehiclePlate: string;

  @Column('decimal', { precision: 10, scale: 2 })
  amountLiters: number;

  @Column('decimal', { precision: 10, scale: 2 })
  costPerLiter: number;

  @Column('decimal', { precision: 10, scale: 2 })
  totalCost: number;

  @Column()
  currency: string;

  @Column()
  location: string;

  @Column('decimal', { precision: 10, scale: 7, nullable: true })
  latitude: number;

  @Column('decimal', { precision: 10, scale: 7, nullable: true })
  longitude: number;

  @Column({ nullable: true })
  odometerReading: number;

  @Column({ nullable: true })
  receiptPhotoUrl: string;

  @Column()
  loggedBy: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'loggedBy' })
  logger: User;

  @Column({ nullable: true })
  verifiedBy: string;

  @Column({ default: false })
  isVerified: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
