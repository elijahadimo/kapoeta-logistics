import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum BranchType {
  HQ = 'hq',
  BORDER = 'border',
  CITY = 'city',
  LOCAL = 'local',
}

@Entity('branches')
export class Branch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column()
  location: string;

  @Column()
  country: string;

  @Column({
    type: 'enum',
    enum: BranchType,
    default: BranchType.LOCAL,
  })
  type: BranchType;

  @Column('decimal', { precision: 10, scale: 7, nullable: true })
  latitude: number;

  @Column('decimal', { precision: 10, scale: 7, nullable: true })
  longitude: number;

  @Column({ default: 500 })
  geofenceRadius: number;

  @Column({ default: false })
  hasAgent: boolean;

  @Column({ nullable: true })
  contactPhone: string;

  @Column({ nullable: true })
  contactEmail: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
