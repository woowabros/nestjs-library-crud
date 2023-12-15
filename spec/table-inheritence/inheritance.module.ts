import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { InheritanceControllerA, InheritanceEntityA, InheritanceServiceA } from './a';
import { CrudAbstractInheritanceEntity } from './abstract-inheritance.entity';
import { InheritanceControllerB, InheritanceEntityB, InheritanceServiceB } from './b';

@Module({
    imports: [TypeOrmModule.forFeature([CrudAbstractInheritanceEntity, InheritanceEntityA, InheritanceEntityB])],
    controllers: [InheritanceControllerA, InheritanceControllerB],
    providers: [InheritanceServiceA, InheritanceServiceB],
})
export class InheritanceModule {}
