import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DeleteAndGetSoftDeletedController } from './delete-and-get-soft-deleted.controller';
import { DeleteAndIgnoreSoftDeletedController } from './delete-and-ignore-soft-deleted.controller';
import { SoftDeleteAndGetSoftDeletedController } from './soft-delete-and-get-soft-deleted.controller';
import { SoftDeleteAndIgnoreSoftDeletedController } from './soft-delete-and-ignore-soft-deleted.controller';
import { BaseEntity } from '../base/base.entity';
import { BaseService } from '../base/base.service';

@Module({
    imports: [TypeOrmModule.forFeature([BaseEntity])],
    controllers: [
        SoftDeleteAndGetSoftDeletedController,
        SoftDeleteAndIgnoreSoftDeletedController,
        DeleteAndGetSoftDeletedController,
        DeleteAndIgnoreSoftDeletedController,
    ],
    providers: [BaseService],
})
export class SoftDeleteAndRecoverModule {}
