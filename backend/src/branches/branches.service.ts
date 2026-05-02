import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Branch, BranchType } from '../entities/branch.entity';

@Injectable()
export class BranchesService {
  constructor(
    @InjectRepository(Branch)
    private branchRepository: Repository<Branch>,
  ) {}

  async create(branchData: Partial<Branch>): Promise<Branch> {
    const existingBranch = await this.branchRepository.findOne({
      where: { name: branchData.name },
    });

    if (existingBranch) {
      throw new ConflictException(`Branch with name ${branchData.name} already exists`);
    }

    const branch = this.branchRepository.create(branchData);
    return await this.branchRepository.save(branch);
  }

  async findAll(): Promise<Branch[]> {
    return await this.branchRepository.find({
      order: { createdAt: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Branch> {
    const branch = await this.branchRepository.findOne({ where: { id } });
    if (!branch) {
      throw new NotFoundException(`Branch with ID ${id} not found`);
    }
    return branch;
  }

  async findByName(name: string): Promise<Branch | null> {
    return await this.branchRepository.findOne({ where: { name } });
  }

  async update(id: string, branchData: Partial<Branch>): Promise<Branch> {
    await this.branchRepository.update(id, branchData);
    return this.findOne(id);
  }

  async delete(id: string): Promise<void> {
    const result = await this.branchRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Branch with ID ${id} not found`);
    }
  }

  async seedBranches(): Promise<void> {
    const branches = [
      {
        name: 'Nairobi',
        location: 'Nairobi, Kenya',
        country: 'Kenya',
        type: BranchType.HQ,
        latitude: -1.2921,
        longitude: 36.8219,
        geofenceRadius: 500,
        hasAgent: true,
        contactPhone: '+254712345678',
        contactEmail: 'nairobi@kapoetakogistics.com',
      },
      {
        name: 'Nadapal',
        location: 'Nadapal Border, Kenya/South Sudan',
        country: 'Kenya',
        type: BranchType.BORDER,
        latitude: 3.7833,
        longitude: 34.3333,
        geofenceRadius: 300,
        hasAgent: false,
        contactPhone: '+254712345679',
        contactEmail: 'nadapal@kapoetakogistics.com',
      },
      {
        name: 'Narus',
        location: 'Narus, South Sudan',
        country: 'South Sudan',
        type: BranchType.LOCAL,
        latitude: 3.7500,
        longitude: 33.8667,
        geofenceRadius: 300,
        hasAgent: false,
        contactPhone: '+211912345678',
        contactEmail: 'narus@kapoetakogistics.com',
      },
      {
        name: 'Kapoeta',
        location: 'Kapoeta, South Sudan',
        country: 'South Sudan',
        type: BranchType.LOCAL,
        latitude: 4.7667,
        longitude: 33.5833,
        geofenceRadius: 500,
        hasAgent: true,
        contactPhone: '+211912345679',
        contactEmail: 'kapoeta@kapoetakogistics.com',
      },
      {
        name: 'Torit',
        location: 'Torit, South Sudan',
        country: 'South Sudan',
        type: BranchType.LOCAL,
        latitude: 4.4167,
        longitude: 32.5667,
        geofenceRadius: 300,
        hasAgent: false,
        contactPhone: '+211912345680',
        contactEmail: 'torit@kapoetakogistics.com',
      },
      {
        name: 'Juba',
        location: 'Juba, South Sudan',
        country: 'South Sudan',
        type: BranchType.CITY,
        latitude: 4.8517,
        longitude: 31.5825,
        geofenceRadius: 500,
        hasAgent: true,
        contactPhone: '+211912345681',
        contactEmail: 'juba@kapoetakogistics.com',
      },
    ];

    for (const branch of branches) {
      const existing = await this.findByName(branch.name);
      if (!existing) {
        await this.create(branch);
        console.log(`Branch created: ${branch.name} (${branch.type})`);
      } else {
        console.log(`Branch already exists: ${branch.name}`);
      }
    }
  }
}
