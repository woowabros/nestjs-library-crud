import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ExcludeSwaggerController } from './exclude-swagger.controller';
import { BaseEntity } from '../base/base.entity';
import { BaseService } from '../base/base.service';

@Module({
    imports: [TypeOrmModule.forFeature([BaseEntity])],
    controllers: [ExcludeSwaggerController],
    providers: [BaseService],
})
export class ExcludeSwaggerModule {}
