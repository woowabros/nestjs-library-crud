import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UniqueController } from './unique.controller';
import { UniqueEntity } from './unique.entity';
import { UniqueService } from './unique.service';

@Module({
    imports: [TypeOrmModule.forFeature([UniqueEntity])],
    controllers: [UniqueController],
    providers: [UniqueService],
})
export class UniqueModule {}
