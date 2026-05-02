import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('waybills')
export class Waybill {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  waybillNumber: string;

  @Column()
  tripId: string;

  @Column({ nullable: true })
  qrCodeUrl: string;

  @Column()
  generatedBy: string;

  @Column('jsonb')
  shipmentManifest: any; // List of shipments on this trip

  @Column({ nullable: true })
  pdfUrl: string;

  @Column({ nullable: true })
  shareableToken: string;

  @CreateDateColumn()
  generatedAt: Date;
}
