/* eslint-disable max-classes-per-file */
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Controller, Injectable, Module } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { IsOptional } from 'class-validator';
import request from 'supertest';
import { Entity, BaseEntity, Repository, PrimaryColumn, Column, DeleteDateColumn } from 'typeorm';

import { Crud } from '../../src/lib/crud.decorator';
import { CrudService } from '../../src/lib/crud.service';
import { CrudController } from '../../src/lib/interface';
import { TestHelper } from '../test.helper';

@Entity('exclude-test')
class TestEntity extends BaseEntity {
    @PrimaryColumn()
    @IsOptional({ always: true })
    col1: number;

    @Column({ nullable: true })
    @IsOptional({ always: true })
    col2: string;

    @Column({ nullable: true })
    @IsOptional({ always: true })
    col3: string;

    @Column({ nullable: true })
    @IsOptional({ always: true })
    col4: string;

    @DeleteDateColumn()
    deletedAt?: Date;
}

@Injectable()
class TestService extends CrudService<TestEntity> {
    constructor(@InjectRepository(TestEntity) repository: Repository<TestEntity>) {
        super(repository);
    }
}

@Crud({
    entity: TestEntity,
    routes: {
        readOne: { exclude: ['col1'] },
        readMany: { exclude: ['col2'] },
        search: { exclude: ['col3'] },
        create: { exclude: ['col4'] },
        update: { exclude: ['col1', 'col2'] },
        delete: { exclude: ['col1', 'col3'] },
        upsert: { exclude: ['col1', 'col4'] },
        recover: { exclude: ['col1', 'col2', 'col3'] },
    },
})
@Controller('base')
class TestController implements CrudController<TestEntity> {
    constructor(public readonly crudService: TestService) {}
}

@Module({
    imports: [TypeOrmModule.forFeature([TestEntity])],
    controllers: [TestController],
    providers: [TestService],
})
class TestModule {}

describe('Exclude key of entity', () => {
    let app: INestApplication;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [TestModule, TestHelper.getTypeOrmPgsqlModule([TestEntity])],
        }).compile();
        app = moduleFixture.createNestApplication();
        await TestEntity.delete({});
        await app.init();
    });

    afterAll(async () => {
        await app?.close();
    });

    it('should be excluded from the response', async () => {
        // exclude col4
        const { body: createdBody } = await request(app.getHttpServer())
            .post('/base')
            .send({
                col1: 1,
                col2: 'col2',
                col3: 'col3',
                col4: 'col4',
            })
            .expect(HttpStatus.CREATED);
        expect(createdBody).toEqual({
            col1: 1,
            col2: 'col2',
            col3: 'col3',
            deletedAt: null,
        });
        expect(createdBody.col4).not.toBeDefined();

        // exclude col1
        const { body: readOneBody } = await request(app.getHttpServer()).get(`/base/${createdBody.col1}`).expect(HttpStatus.OK);
        expect(readOneBody).toEqual({ col2: 'col2', col3: 'col3', col4: 'col4', deletedAt: null });
        expect(readOneBody.col1).not.toBeDefined();

        // exclude col2
        const { body: readManyBody } = await request(app.getHttpServer()).get('/base').expect(HttpStatus.OK);
        expect(readManyBody.data[0]).toEqual({ col1: 1, col3: 'col3', col4: 'col4', deletedAt: null });
        expect(readManyBody.data[0].col2).not.toBeDefined();

        // exclude col3
        const { body: searchBody } = await request(app.getHttpServer()).post('/base/search').expect(HttpStatus.OK);
        expect(searchBody.data[0]).toEqual({ col1: 1, col2: 'col2', col4: 'col4', deletedAt: null });
        expect(searchBody.data[0].col3).not.toBeDefined();

        // exclude col1, col2
        const { body: updatedBody } = await request(app.getHttpServer())
            .patch(`/base/${createdBody.col1}`)
            .send({ col2: 'test' })
            .expect(HttpStatus.OK);
        expect(updatedBody).toEqual({ col3: 'col3', col4: 'col4', deletedAt: null });
        expect(updatedBody.col1).not.toBeDefined();
        expect(updatedBody.col2).not.toBeDefined();

        // exclude col1, col3
        const { body: deletedBody } = await request(app.getHttpServer()).delete(`/base/${createdBody.col1}`).expect(HttpStatus.OK);
        expect(deletedBody).toEqual({ col2: 'test', col4: 'col4', deletedAt: expect.any(String) });
        expect(deletedBody.col1).not.toBeDefined();
        expect(deletedBody.col3).not.toBeDefined();

        // exclude col1, col2, col3
        const { body: recoverBody } = await request(app.getHttpServer())
            .post(`/base/${createdBody.col1}/recover`)
            .expect(HttpStatus.CREATED);
        expect(recoverBody).toEqual({ col4: 'col4', deletedAt: null });
        expect(recoverBody.col1).not.toBeDefined();
        expect(recoverBody.col2).not.toBeDefined();
        expect(recoverBody.col3).not.toBeDefined();

        // exclude col1, col4
        const { body: upsertBody } = await request(app.getHttpServer()).put('/base/100').send({ col2: 'test' }).expect(HttpStatus.OK);
        expect(upsertBody).toEqual({ col2: 'test', col3: null, deletedAt: null });
        expect(upsertBody.col1).not.toBeDefined();
        expect(upsertBody.col4).not.toBeDefined();
    });
});
