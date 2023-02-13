/* eslint-disable max-classes-per-file */
import { Controller, Injectable, Module } from '@nestjs/common';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { Entity, BaseEntity, Repository, Column, PrimaryGeneratedColumn } from 'typeorm';

import { Address, Person } from './interface';
import { Crud } from '../../src/lib/crud.decorator';
import { CrudService } from '../../src/lib/crud.service';
import { CrudController } from '../../src/lib/interface';

@Entity('json_column_entity')
export class JsonColumnEntity extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'json' })
    colors: string[];

    @Column({ type: 'json', nullable: true })
    friends: Person[];

    @Column({ type: 'json' })
    address: Address;
}

@Injectable()
export class JsonColumnService extends CrudService<JsonColumnEntity> {
    constructor(@InjectRepository(JsonColumnEntity) repository: Repository<JsonColumnEntity>) {
        super(repository);
    }
}

@Crud({ entity: JsonColumnEntity })
@Controller('json')
export class JsonColumnController implements CrudController<JsonColumnEntity> {
    constructor(public readonly crudService: JsonColumnService) {}
}

@Module({
    imports: [TypeOrmModule.forFeature([JsonColumnEntity])],
    controllers: [JsonColumnController],
    providers: [JsonColumnService],
})
export class JsonColumnModule {}
