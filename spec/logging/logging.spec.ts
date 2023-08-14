/* eslint-disable max-classes-per-file */
import { ConsoleLogger, INestApplication } from '@nestjs/common';
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

const logger = new ConsoleLogger();
logger.setLogLevels(['error']);
@Entity('test')
class TestEntity extends BaseEntity {
    @PrimaryColumn()
    @IsOptional({ always: true })
    col1: number;

    @Column({ nullable: true })
    @IsOptional({ always: true })
    col2: string;

    @DeleteDateColumn()
    deletedAt?: Date;
}

@Injectable()
class TestService extends CrudService<TestEntity> {
    constructor(@InjectRepository(TestEntity) repository: Repository<TestEntity>) {
        super(repository);
    }
}

@Crud({ entity: TestEntity, logging: true })
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

describe('Logging', () => {
    let app: INestApplication;
    let loggerSpy: jest.SpyInstance;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [TestModule, TestHelper.getTypeOrmPgsqlModule([TestEntity])],
        })
            .setLogger(logger)
            .compile();

        loggerSpy = jest.spyOn(logger, 'debug');
        app = moduleFixture.createNestApplication();
        await app.init();
    });

    afterAll(async () => {
        await TestHelper.dropTypeOrmEntityTables();
        await app?.close();
    });

    it('should be output debugging logs of all methods', async () => {
        await request(app.getHttpServer()).post('/base').send({
            col1: 1,
        });
        expect(loggerSpy).toHaveBeenNthCalledWith(1, { body: { col1: 1 } }, 'CRUD POST /base');

        await request(app.getHttpServer()).get('/base');
        expect(loggerSpy).toHaveBeenNthCalledWith(
            2,
            JSON.stringify({
                _primaryKeys: [{ name: 'col1', isPrimary: true }],
                _findOptions: {
                    where: {},
                    take: 20,
                    order: { col1: 'DESC' },
                    withDeleted: false,
                    relations: [],
                },
                _pagination: { _isNext: false, type: 'cursor', _where: btoa('{}') },
                _sort: 'DESC',
            }),
            'CRUD GET /base',
        );

        await request(app.getHttpServer()).get('/base/1');
        expect(loggerSpy).toHaveBeenNthCalledWith(
            3,
            {
                params: {
                    col1: '1',
                },
                fields: [],
                relations: [],
                softDeleted: expect.any(Boolean),
            },
            'CRUD GET /base/1',
        );

        await request(app.getHttpServer()).patch('/base/1').send({ col2: 'test' });
        expect(loggerSpy).toHaveBeenNthCalledWith(
            4,
            {
                params: {
                    col1: '1',
                },
                body: {
                    col2: 'test',
                },
            },
            'CRUD PATCH /base/1',
        );

        await request(app.getHttpServer()).put('/base/2');
        expect(loggerSpy).toHaveBeenNthCalledWith(
            5,
            {
                params: {
                    col1: '2',
                },
                body: {},
            },
            'CRUD PUT /base/2',
        );

        await request(app.getHttpServer()).delete('/base/1');
        expect(loggerSpy).toHaveBeenNthCalledWith(
            6,
            {
                params: {
                    col1: '1',
                },
                softDeleted: true,
            },
            'CRUD DELETE /base/1',
        );

        await request(app.getHttpServer()).post('/base/1/recover');
        expect(loggerSpy).toHaveBeenNthCalledWith(
            7,
            {
                params: {
                    col1: '1',
                },
            },
            'CRUD POST /base/1/recover',
        );
    });
});
