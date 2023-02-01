import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { NumberOfTakeController } from './number-of-take.controller';
import { SortAscController } from './sort-asc.controller';
import { SortDescController } from './sort-desc.controller';
import { BaseEntity } from '../base/base.entity';
import { BaseService } from '../base/base.service';

@Module({
    imports: [TypeOrmModule.forFeature([BaseEntity])],
    controllers: [SortAscController, SortDescController, NumberOfTakeController],
    providers: [BaseService],
})
export class ReadManyModule {}
