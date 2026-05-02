import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Shipment } from './shipment.entity';
import { User } from './user.entity';

@Entity('feedbacks')
export class Feedback {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  shipmentId: string;

  @ManyToOne(() => Shipment)
  @JoinColumn({ name: 'shipmentId' })
  shipment: Shipment;

  @Column()
  customerName: string;

  @Column()
  customerPhone: string;

  @Column({ nullable: true })
  customerEmail: string;

  @Column('int')
  rating: number; // 1-5 stars

  @Column('text', { nullable: true })
  comment: string;

  @Column({ nullable: true })
  deliveryExperience: string;

  @Column('text', { array: true, nullable: true })
  photos: string[];

  @Column({ default: false })
  isPublic: boolean;

  @Column({ nullable: true })
  respondedBy: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'respondedBy' })
  responder: User;

  @Column('text', { nullable: true })
  responseMessage: string;

  @Column({ nullable: true })
  respondedAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
