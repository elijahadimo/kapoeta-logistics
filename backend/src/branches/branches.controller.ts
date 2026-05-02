import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { BranchesService } from './branches.service';
import { Branch } from '../entities/branch.entity';

@Controller('branches')
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Post()
  async create(@Body() branchData: Partial<Branch>) {
    return await this.branchesService.create(branchData);
  }

  @Get()
  async findAll() {
    return await this.branchesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.branchesService.findOne(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() branchData: any) {
    try {
      const updated = await this.branchesService.update(id, branchData);
      return {
        success: true,
        message: 'Branch updated successfully',
        data: updated
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return await this.branchesService.delete(id);
  }

  @Post('seed')
  async seedBranches() {
    await this.branchesService.seedBranches();
    return { message: 'Branches seeded successfully' };
  }
}
