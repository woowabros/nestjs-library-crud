import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SwaggerDecoratorController } from './swagger-decorator.controller';
import { BaseEntity } from '../base/base.entity';
import { BaseService } from '../base/base.service';

@Module({
    imports: [TypeOrmModule.forFeature([BaseEntity])],
    controllers: [SwaggerDecoratorController],
    providers: [BaseService],
})
export class SwaggerDecoratorModule {}
