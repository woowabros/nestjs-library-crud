/* eslint-disable max-classes-per-file */
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Controller, Injectable, Module } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { IsOptional } from 'class-validator';
import request from 'supertest';
import {
    Entity,
    BaseEntity,
    Repository,
    PrimaryColumn,
    DeleteDateColumn,
    CreateDateColumn,
    UpdateDateColumn,
    Column,
    BeforeRemove,
    BeforeInsert,
    BeforeUpdate,
    BeforeSoftRemove,
    BeforeRecover,
} from 'typeorm';

import { Crud } from '../../src/lib/crud.decorator';
import { CrudService } from '../../src/lib/crud.service';
import { CrudController } from '../../src/lib/interface';
import { TestHelper } from '../test.helper';

@Entity('listeners-off')
class TestEntity extends BaseEntity {
    @PrimaryColumn()
    @IsOptional({ always: true })
    col1: number;

    @Column({ nullable: true })
    @IsOptional({ always: true })
    col2: string;

    @Column({ nullable: true })
    status: string;

    @CreateDateColumn()
    createdAt?: Date;

    @UpdateDateColumn()
    updatedAt?: Date;

    @DeleteDateColumn()
    deletedAt?: Date;

    @BeforeInsert()
    beforeInsert() {
        this.status = 'created';
    }

    @BeforeUpdate()
    beforeUpdate() {
        this.status = 'updated';
    }

    @BeforeRemove()
    beforeRemove() {
        this.status = 'removed';
    }

    @BeforeSoftRemove()
    beforeSoftRemove() {
        this.status = 'softRemoved';
    }

    @BeforeRecover()
    beforeRecover() {
        this.status = 'recovered';
    }
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
        create: { listeners: false },
        update: { listeners: false },
        delete: { listeners: false },
        upsert: { listeners: false },
        recover: { listeners: false },
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

describe('disallow Listeners', () => {
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

    it('should not be changed status by trigging', async () => {
        const { body: createdBody } = await request(app.getHttpServer())
            .post('/base')
            .send({ col1: 1, col2: 'created' })
            .expect(HttpStatus.CREATED);
        expect(createdBody).toEqual({
            col1: 1,
            col2: 'created',
            status: null,
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
            deletedAt: null,
        });

        const { body: updatedBody } = await request(app.getHttpServer())
            .patch(`/base/${createdBody.col1}`)
            .send({ col2: 'updated' })
            .expect(HttpStatus.OK);
        expect(updatedBody).toEqual({
            col1: 1,
            col2: 'updated',
            status: null,
            createdAt: updatedBody.createdAt,
            updatedAt: expect.any(String),
            deletedAt: null,
        });
        expect(updatedBody.updatedAt).not.toEqual(createdBody.updatedAt);
        const { body: deletedBody } = await request(app.getHttpServer()).delete(`/base/${createdBody.col1}`).expect(HttpStatus.OK);
        expect(deletedBody).toEqual({
            col1: 1,
            col2: 'updated',
            status: null,
            createdAt: updatedBody.createdAt,
            updatedAt: expect.any(String),
            deletedAt: expect.any(String),
        });
        expect(deletedBody.updatedAt).not.toEqual(updatedBody.updatedAt);

        const { body: recoverBody } = await request(app.getHttpServer())
            .post(`/base/${createdBody.col1}/recover`)
            .expect(HttpStatus.CREATED);
        expect(recoverBody).toEqual({
            col1: 1,
            col2: 'updated',
            status: null,
            createdAt: updatedBody.createdAt,
            updatedAt: expect.any(String),
            deletedAt: null,
        });
        expect(recoverBody.updatedAt).not.toEqual(deletedBody.updatedAt);
    });
});
