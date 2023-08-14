/* eslint-disable max-classes-per-file */
import { Controller, Injectable, Module } from '@nestjs/common';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { IsOptional } from 'class-validator';
import { Entity, BaseEntity, Repository, PrimaryColumn, Column } from 'typeorm';

import { Crud } from '../../src/lib/crud.decorator';
import { CrudService } from '../../src/lib/crud.service';
import { GROUP } from '../../src/lib/interface';
import { CrudController } from '../../src/lib/interface';

@Entity('test')
export class TestEntity extends BaseEntity {
    @PrimaryColumn()
    @IsOptional({ groups: [GROUP.SEARCH] })
    col1: string;

    @Column()
    @IsOptional({ groups: [GROUP.SEARCH] })
    col2: number;

    @Column({ nullable: true })
    @IsOptional({ groups: [GROUP.SEARCH] })
    col3: number;
}

@Injectable()
export class TestService extends CrudService<TestEntity> {
    constructor(@InjectRepository(TestEntity) repository: Repository<TestEntity>) {
        super(repository);
    }
}

@Crud({
    entity: TestEntity,
    routes: {
        search: {
            numberOfTake: 5,
            limitOfTake: 100,
        },
    },
    logging: true,
})
@Controller('base')
export class TestController implements CrudController<TestEntity> {
    constructor(public readonly crudService: TestService) {}
}

@Module({
    imports: [TypeOrmModule.forFeature([TestEntity])],
    controllers: [TestController],
    providers: [TestService],
})
export class TestModule {}
