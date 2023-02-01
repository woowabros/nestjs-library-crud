import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthGuardController } from './auth-guard.controller';
import { AuthGuard } from './auth.guard';
import { BaseEntity } from '../base/base.entity';
import { BaseService } from '../base/base.service';

@Module({
    imports: [TypeOrmModule.forFeature([BaseEntity])],
    controllers: [AuthGuardController],
    providers: [BaseService, AuthGuard],
})
export class AuthGuardModule {}
