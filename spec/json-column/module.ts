/* eslint-disable max-classes-per-file */
import { Controller, Injectable, Module } from '@nestjs/common';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { Entity, BaseEntity, Repository, Column, PrimaryGeneratedColumn } from 'typeorm';

import { Crud } from '../../src/lib/crud.decorator';
import { CrudService } from '../../src/lib/crud.service';
import { CrudController } from '../../src/lib/interface';

interface Person {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    gender: string;
}

@Entity('json_column_entity')
export class JsonColumnEntity extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'jsonb' })
    colors: string[];

    @Column({ type: 'jsonb', nullable: true })
    friends: Person[];
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
