import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { MultiplePrimaryKeyController } from './multiple-primary-key.controller';
import { MultiplePrimaryKeyEntity } from './multiple-primary-key.entity';
import { MultiplePrimaryKeyService } from './multiple-primary-key.service';

@Module({
    imports: [TypeOrmModule.forFeature([MultiplePrimaryKeyEntity])],
    controllers: [MultiplePrimaryKeyController],
    providers: [MultiplePrimaryKeyService],
})
export class MultiplePrimaryKeyModule {}
