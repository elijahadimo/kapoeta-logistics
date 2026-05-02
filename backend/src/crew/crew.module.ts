import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CrewService } from './crew.service';
import { CrewController } from './crew.controller';
import { Crew } from '../entities/crew.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Crew])],
  controllers: [CrewController],
  providers: [CrewService],
  exports: [CrewService],
})
export class CrewModule {}
