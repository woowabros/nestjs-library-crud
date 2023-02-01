import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CustomEntityController } from './custom-entity.controller';
import { CustomEntity } from './custom-entity.entity';
import { CustomEntityService } from './custom-entity.service';

@Module({
    imports: [TypeOrmModule.forFeature([CustomEntity])],
    controllers: [CustomEntityController],
    providers: [CustomEntityService],
})
export class CustomEntityModule {}
