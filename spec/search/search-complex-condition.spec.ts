/* eslint-disable max-classes-per-file */
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Controller, Injectable, Module } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { IsOptional } from 'class-validator';
import _ from 'lodash';
import request from 'supertest';
import { Entity, BaseEntity, Repository, PrimaryColumn, Column, ObjectLiteral } from 'typeorm';

import { Crud } from '../../src/lib/crud.decorator';
import { CrudService } from '../../src/lib/crud.service';
import { CrudController } from '../../src/lib/interface';
import { TestHelper } from '../test.helper';

@Entity('test')
class TestEntity extends BaseEntity {
    @PrimaryColumn()
    @IsOptional({ always: true })
    col1: number;

    @Column({ type: 'jsonb', nullable: true })
    @IsOptional({ always: true })
    col2: ObjectLiteral;

    @Column({ type: 'jsonb', nullable: true })
    @IsOptional({ always: true })
    col3: ObjectLiteral;
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

describe('Search complex conditions', () => {
    let app: INestApplication;

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [TestModule, TestHelper.getTypeOrmPgsqlModule([TestEntity])],
        }).compile();
        app = moduleFixture.createNestApplication();
        await app.init();

        await Promise.all(
            _.range(10).map((no) =>
                request(app.getHttpServer())
                    .post('/base')
                    .send({
                        col1: no,
                        col2: [{ multiple2: no % 2 === 0, multiple4: no % 4 === 0 }],
                        col3: [{ multiple3: no % 3 === 0, multiple5: no % 5 === 0 }],
                    }),
            ),
        );
    });

    afterEach(async () => {
        await TestHelper.dropTypeOrmEntityTables();
        await app?.close();
    });

    it('should be used duplicate operator', async () => {
        const { body: multiple2 } = await request(app.getHttpServer())
            .post('/base/search')
            .send({
                where: [{ col2: { operator: '@>', operand: '[{"multiple2": true}]' } }],
            })
            .expect(HttpStatus.OK);
        expect(multiple2.data).toHaveLength(5);
        expect(multiple2.data.map((d: TestEntity) => d.col1)).toEqual(expect.arrayContaining([0, 2, 4, 6, 8]));

        const { body: multiple3 } = await request(app.getHttpServer())
            .post('/base/search')
            .send({
                where: [{ col3: { operator: '@>', operand: '[{"multiple3": true}]' } }],
            })
            .expect(HttpStatus.OK);
        expect(multiple3.data).toHaveLength(4);
        expect(multiple3.data.map((d: TestEntity) => d.col1)).toEqual(expect.arrayContaining([0, 3, 6, 9]));

        const { body: multiple2N3 } = await request(app.getHttpServer())
            .post('/base/search')
            .send({
                where: [
                    {
                        col2: { operator: '@>', operand: '[{"multiple2": true}]' },
                        col3: { operator: '@>', operand: '[{"multiple3": true}]' },
                    },
                ],
            })
            .expect(HttpStatus.OK);
        expect(multiple2N3.data).toHaveLength(2);
        expect(multiple2N3.data.map((d: TestEntity) => d.col1)).toEqual(expect.arrayContaining([0, 6]));

        const { body: multiple4 } = await request(app.getHttpServer())
            .post('/base/search')
            .send({
                where: [{ col2: { operator: '@>', operand: '[{"multiple4": true}]' } }],
            })
            .expect(HttpStatus.OK);
        expect(multiple4.data).toHaveLength(3);
        expect(multiple4.data.map((d: TestEntity) => d.col1)).toEqual(expect.arrayContaining([0, 4, 8]));

        const { body: multiple2N3or4 } = await request(app.getHttpServer())
            .post('/base/search')
            .send({
                where: [
                    {
                        col2: { operator: '@>', operand: '[{"multiple2": true}]' },
                        col3: { operator: '@>', operand: '[{"multiple3": true}]' },
                    },
                    {
                        col2: { operator: '@>', operand: '[{"multiple4": true}]' },
                    },
                ],
            })
            .expect(HttpStatus.OK);
        expect(multiple2N3or4.data).toHaveLength(4);
        expect(multiple2N3or4.data.map((d: TestEntity) => d.col1)).toEqual(expect.arrayContaining([0, 4, 6, 8]));

        const { body: multiple5 } = await request(app.getHttpServer())
            .post('/base/search')
            .send({
                where: [{ col3: { operator: '@>', operand: '[{"multiple5": true}]' } }],
            })
            .expect(HttpStatus.OK);
        expect(multiple5.data).toHaveLength(2);
        expect(multiple5.data.map((d: TestEntity) => d.col1)).toEqual(expect.arrayContaining([0, 5]));

        const { body: multiple2N3or5 } = await request(app.getHttpServer())
            .post('/base/search')
            .send({
                where: [
                    {
                        col2: { operator: '@>', operand: '[{"multiple2": true}]' },
                        col3: { operator: '@>', operand: '[{"multiple3": true}]' },
                    },
                    {
                        col3: { operator: '@>', operand: '[{"multiple5": true}]' },
                    },
                ],
            })
            .expect(HttpStatus.OK);
        expect(multiple2N3or5.data).toHaveLength(3);
        expect(multiple2N3or5.data.map((d: TestEntity) => d.col1)).toEqual(expect.arrayContaining([0, 5, 6]));
    });
});
