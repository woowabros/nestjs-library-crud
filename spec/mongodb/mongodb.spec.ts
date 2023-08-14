/* eslint-disable max-classes-per-file */
import { Controller, HttpStatus, INestApplication, Injectable, Module } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { Transform } from 'class-transformer';
import { IsObject, IsOptional, IsString } from 'class-validator';
import { ObjectId } from 'mongodb';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { BaseEntity, Column, Entity, ObjectIdColumn, Repository } from 'typeorm';

import { Crud, CrudController, CrudService, GROUP } from '../../src';
import { TestHelper } from '../test.helper';

@Entity('test')
class TestEntity extends BaseEntity {
    @ObjectIdColumn()
    @Transform(({ value }) => value && new ObjectId(value))
    @IsObject({ groups: [GROUP.PARAMS] })
    _id: ObjectId;

    @Column({ nullable: true })
    @IsString({ always: true })
    @IsOptional({
        groups: [GROUP.DELETE, GROUP.PARAMS, GROUP.READ_MANY, GROUP.READ_ONE, GROUP.RECOVER, GROUP.SEARCH, GROUP.UPDATE, GROUP.UPSERT],
    })
    name: string;

    @Column({ nullable: true })
    @IsObject({ always: true })
    @IsOptional({ always: true })
    col2: {
        a: number;
    };

    @Column({ nullable: true })
    @IsObject({ always: true })
    @IsOptional({ always: true })
    col3: {
        a: string;
        b: string;
    };
}

@Injectable()
class TestService extends CrudService<TestEntity> {
    constructor(@InjectRepository(TestEntity) repository: Repository<TestEntity>) {
        super(repository);
    }
}

@Crud({ entity: TestEntity })
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

describe('mongodb', () => {
    let mongod: MongoMemoryServer;
    let app: INestApplication;

    beforeAll(async () => {
        mongod = await MongoMemoryServer.create();
        const mongoUri = mongod.getUri();

        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [TestModule, TestHelper.getTypeOrmMongoModule(mongoUri, [TestEntity])],
        }).compile();
        app = moduleFixture.createNestApplication();
        await app.init();
    });

    afterAll(async () => {
        await mongod?.stop();
        await app?.close();
    });

    it('should be provided endpoints', async () => {
        const routerPathList = TestHelper.getRoutePath(app.getHttpServer());
        expect(routerPathList).toEqual({
            get: ['/base/:_id', '/base'],
            post: ['/base', '/base/:_id/recover', '/base/search'],
            patch: ['/base/:_id'],
            delete: ['/base/:_id'],
            put: ['/base/:_id'],
        });
    });

    it('should be completed default operation', async () => {
        const { body: createBody } = await request(app.getHttpServer()).post('/base').send({ name: 'test' }).expect(HttpStatus.CREATED);
        expect(createBody.name).toBe('test');
        expect(createBody._id).toBeDefined();

        const { body: readManyBody } = await request(app.getHttpServer()).get('/base').expect(HttpStatus.OK);
        expect(readManyBody.data).toHaveLength(1);
        expect(readManyBody.data[0]).toEqual({ name: 'test', _id: createBody._id });

        const { body: readOneBody } = await request(app.getHttpServer()).get(`/base/${createBody._id}`).expect(HttpStatus.OK);
        expect(readOneBody).toEqual({ name: 'test', _id: createBody._id });

        const { body: updateBody } = await request(app.getHttpServer())
            .patch(`/base/${createBody._id}`)
            .send({ name: 'changed' })
            .expect(HttpStatus.OK);
        expect(updateBody._id).toEqual(createBody._id);
        expect(updateBody.name).toBe('changed');

        const newObjectId = '642fb1b43ca2efcf4a7bdd71';
        const { body: upsertBody } = await request(app.getHttpServer())
            .put(`/base/${newObjectId}`)
            .send({ name: 'name2' })
            .expect(HttpStatus.OK);
        expect(upsertBody._id).toEqual(newObjectId);
        expect(upsertBody.name).toEqual('name2');

        const { body: deleteBody } = await request(app.getHttpServer()).delete(`/base/${createBody._id}`).expect(HttpStatus.OK);
        expect(deleteBody._id).toEqual(createBody._id);

        const { body: recoveryBody } = await request(app.getHttpServer())
            .post(`/base/${createBody._id}/recover`)
            .expect(HttpStatus.CREATED);
        expect(recoveryBody._id).toEqual(createBody._id);
    });
});
