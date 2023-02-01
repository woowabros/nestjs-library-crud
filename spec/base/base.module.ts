import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { BaseController } from './base.controller';
import { BaseEntity } from './base.entity';
import { BaseService } from './base.service';

@Module({
    imports: [TypeOrmModule.forFeature([BaseEntity])],
    controllers: [BaseController],
    providers: [BaseService],
})
export class BaseModule {}
