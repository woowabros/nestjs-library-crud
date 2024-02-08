import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { EmployeeController } from './employee.controller';
import { EmployeeEntity } from './employee.entity';
import { EmployeeService } from './employee.service';
import { UserController } from './user.controller';
import { UserEntity } from './user.entity';
import { UserService } from './user.service';

@Module({
    imports: [TypeOrmModule.forFeature([UserEntity, EmployeeEntity])],
    controllers: [UserController, EmployeeController],
    providers: [UserService, EmployeeService],
})
export class EmbeddedEntitiesModule {}
