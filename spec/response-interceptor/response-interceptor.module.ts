import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { BaseController } from './response-interceptor.controller';
import { BaseEntity } from '../base/base.entity';
import { BaseService } from '../base/base.service';

@Module({
    imports: [TypeOrmModule.forFeature([BaseEntity])],
    controllers: [BaseController],
    providers: [BaseService],
})
export class BaseModule {}
