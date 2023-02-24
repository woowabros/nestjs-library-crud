/* eslint-disable max-classes-per-file */
import { Controller, Injectable, Module } from '@nestjs/common';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { IsInt, IsOptional, IsString } from 'class-validator';
import { Entity, BaseEntity, Repository, PrimaryColumn, Column, DeleteDateColumn } from 'typeorm';

import { AuthorInterceptor } from './author-object.interceptor';
import { Crud } from '../../src/lib/crud.decorator';
import { CrudService } from '../../src/lib/crud.service';
import { CrudController, Method } from '../../src/lib/interface';

export interface Author {
    department: string;
    id: string;
    name: string;
    modifiedAt: Date;
}
@Entity('author_object')
export class TestEntity extends BaseEntity {
    @PrimaryColumn()
    @IsString({ always: true })
    @IsOptional({ groups: [Method.UPSERT, Method.UPDATE] })
    col1: string;

    @Column()
    @IsInt({ always: true })
    @IsOptional({ groups: [Method.UPDATE] })
    col2: number;

    @Column({ nullable: true })
    @IsInt({ always: true })
    @IsOptional({ groups: [Method.UPDATE] })
    col3: number;

    @Column({ type: 'jsonb', nullable: true })
    createdBy: Author;

    @Column({ type: 'jsonb', nullable: true })
    updatedBy: Author;

    @Column({ type: 'jsonb', nullable: true })
    deletedBy: Author;

    @DeleteDateColumn()
    deletedAt?: Date;
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
        create: {
            interceptors: [AuthorInterceptor],
            author: {
                filter: 'user',
                property: 'createdBy',
            },
        },
        update: {
            interceptors: [AuthorInterceptor],
            author: {
                filter: 'user',
                property: 'updatedBy',
            },
        },
        upsert: {
            interceptors: [AuthorInterceptor],
            author: {
                filter: 'user',
                property: 'updatedBy',
            },
        },
        delete: {
            interceptors: [AuthorInterceptor],
            author: {
                filter: 'user',
                property: 'deletedBy',
            },
        },
    },
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
