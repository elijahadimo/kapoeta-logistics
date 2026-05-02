import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Shipment } from './shipment.entity';
import { User } from './user.entity';

export enum IncidentType {
  ACCIDENT = 'accident',
  THEFT = 'theft',
  DAMAGE = 'damage',
  LOSS = 'loss',
  DELAY = 'delay',
}

export enum IncidentSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum IncidentStatus {
  REPORTED = 'reported',
  INVESTIGATING = 'investigating',
  RESOLVED_REFUNDED = 'resolved_refunded',
  RESOLVED_INSURER = 'resolved_insurer',
  CLOSED = 'closed',
}

@Entity('incidents')
export class Incident {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  incidentNumber: string;

  @Column({ type: 'enum', enum: IncidentType })
  type: IncidentType;

  @Column({ type: 'enum', enum: IncidentSeverity, default: IncidentSeverity.MEDIUM })
  severity: IncidentSeverity;

  @Column('text')
  description: string;

  @Column({ nullable: true })
  voiceNoteUrl: string;

  @Column({ nullable: true })
  voiceTranscript: string;

  @Column({ nullable: true })
  shipmentId: string;

  @ManyToOne(() => Shipment)
  @JoinColumn({ name: 'shipmentId' })
  shipment: Shipment;

  @Column({ nullable: true })
  tripId: string;

  @Column()
  reportedBy: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'reportedBy' })
  reporter: User;

  @Column('text', { array: true, nullable: true })
  photoUrls: string[];

  @Column({ type: 'enum', enum: IncidentStatus, default: IncidentStatus.REPORTED })
  status: IncidentStatus;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  estimatedLoss: number;

  @Column({ nullable: true })
  lossCurrency: string;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  refundAmount: number;

  @Column({ nullable: true })
  refundCurrency: string;

  @Column({ nullable: true })
  refundApprovedBy: string;

  @Column({ default: false })
  insuranceClaimFiled: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  resolvedAt: Date;
}
