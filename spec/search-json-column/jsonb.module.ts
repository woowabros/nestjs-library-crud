/* eslint-disable max-classes-per-file */
import { Controller, Injectable, Module } from '@nestjs/common';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { BaseEntity, Column, Entity, PrimaryGeneratedColumn, Repository } from 'typeorm';

import { Address, Person } from './interface';
import { Crud, CrudService, CrudController } from '../../src';

@Entity('jsonb_column_entity')
export class JsonbColumnEntity extends BaseEntity {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    id: number;

    @Column({ type: 'jsonb' })
    colors: string[];

    @Column({ type: 'jsonb', nullable: true })
    friends: Person[];

    @Column({ type: 'json' })
    address: Address;
}

@Injectable()
export class JsonbColumnService extends CrudService<JsonbColumnEntity> {
    constructor(@InjectRepository(JsonbColumnEntity) repository: Repository<JsonbColumnEntity>) {
        super(repository);
    }
}

@Crud({ entity: JsonbColumnEntity })
@Controller('jsonb')
export class JsonbColumnController implements CrudController<JsonbColumnEntity> {
    constructor(public readonly crudService: JsonbColumnService) {}
}

@Module({
    imports: [TypeOrmModule.forFeature([JsonbColumnEntity])],
    controllers: [JsonbColumnController],
    providers: [JsonbColumnService],
})
export class JsonbColumnModule {}
