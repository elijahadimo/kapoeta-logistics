import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Crew } from '../entities/crew.entity';

@Injectable()
export class CrewService {
  constructor(
    @InjectRepository(Crew)
    private crewRepository: Repository<Crew>,
  ) {}

  async create(crewData: Partial<Crew>): Promise<Crew> {
    const crew = this.crewRepository.create(crewData);
    return await this.crewRepository.save(crew);
  }

  async createMultiple(crewList: Partial<Crew>[]): Promise<Crew[]> {
    const crews = this.crewRepository.create(crewList);
    return await this.crewRepository.save(crews);
  }

  async findByTrip(tripId: string, type?: string): Promise<Crew[]> {
    const where: any = { tripId };
    if (type) where.type = type;
    return await this.crewRepository.find({ where, order: { createdAt: 'DESC' } });
  }

  async findByShipment(shipmentId: string, type?: string): Promise<Crew[]> {
    const where: any = { shipmentId };
    if (type) where.type = type;
    return await this.crewRepository.find({ where, order: { createdAt: 'DESC' } });
  }

  async update(id: string, crewData: Partial<Crew>): Promise<Crew> {
    await this.crewRepository.update(id, crewData);
    const updated = await this.crewRepository.findOne({ where: { id } });
    if (!updated) {
      throw new NotFoundException(`Crew with ID ${id} not found`);
    }
    return updated;
  }

  async delete(id: string): Promise<void> {
    const result = await this.crewRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Crew with ID ${id} not found`);
    }
  }
}
