import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import _ from 'lodash';
import request from 'supertest';

import { ReadManyModule } from './read-many.module';
import { BaseEntity } from '../base/base.entity';
import { BaseService } from '../base/base.service';
import { TestHelper } from '../test.helper';

describe('ReadMany - Options', () => {
    let app: INestApplication;
    let service: BaseService;
    const defaultLimit = 20;

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [ReadManyModule, TestHelper.getTypeOrmMysqlModule([BaseEntity])],
        }).compile();
        app = moduleFixture.createNestApplication();

        service = moduleFixture.get<BaseService>(BaseService);
        await Promise.all(_.range(100).map((number) => service.repository.save(service.repository.create({ name: `name-${number}` }))));

        await app.init();
    });

    afterEach(async () => {
        await TestHelper.dropTypeOrmEntityTables();
        await app?.close();
    });

    describe('Sort ASC', () => {
        it('should sort entities in ascending order by pagination key', async () => {
            const response = await request(app.getHttpServer()).get('/sort-asc');
            expect(response.statusCode).toEqual(HttpStatus.OK);
            expect(response.body.data).toHaveLength(defaultLimit);

            // eslint-disable-next-line unicorn/no-array-for-each
            (response.body.data as BaseEntity[]).forEach((d, idx, arr) => {
                if (idx === 0) {
                    return;
                }
                expect(d.id).toBeGreaterThan(arr[idx - 1].id);
            });

            (response.body.data as BaseEntity[]).reduce((pre, value) => {
                if (!pre) {
                    return value;
                }
                expect(value.id).toBeGreaterThan(pre.id);
                return value;
            });
        });

        it('should return next 20 entities after cursor in ascending order', async () => {
            const firstResponse = await request(app.getHttpServer()).get('/sort-asc').expect(HttpStatus.OK);
            const nextResponse = await request(app.getHttpServer()).get('/sort-asc').query({
                nextCursor: firstResponse.body.metadata.nextCursor,
            });

            expect(nextResponse.statusCode).toEqual(HttpStatus.OK);
            expect(nextResponse.body.data).toHaveLength(defaultLimit);
            expect(nextResponse.body.metadata.nextCursor).toBeDefined();
            expect(nextResponse.body.metadata.limit).toEqual(defaultLimit);

            expect(firstResponse.body.metadata.nextCursor).not.toEqual(nextResponse.body.metadata.nextCursor);

            const lastOneOfFirstResponse = firstResponse.body.data.pop();
            const firstOneOfNextResponse = nextResponse.body.data.shift();
            expect(lastOneOfFirstResponse.id + 1).toEqual(firstOneOfNextResponse.id);
            expect(lastOneOfFirstResponse.name).not.toEqual(firstOneOfNextResponse.name);

            // eslint-disable-next-line unicorn/no-array-for-each
            (nextResponse.body.data as BaseEntity[]).forEach((d, idx, arr) => {
                if (idx === 0) {
                    return;
                }
                expect(d.id).toBeGreaterThan(arr[idx - 1].id);
            });

            (nextResponse.body.data as BaseEntity[]).reduce((pre, value) => {
                if (!pre) {
                    return value;
                }
                expect(value.id).toBeGreaterThan(pre.id);
                return value;
            });
        });
    });

    describe('Sort DESC', () => {
        it('should sort entities in descending order by pagination key', async () => {
            const response = await request(app.getHttpServer()).get('/sort-desc');
            expect(response.statusCode).toEqual(HttpStatus.OK);
            expect(response.body.data).toHaveLength(defaultLimit);

            // eslint-disable-next-line unicorn/no-array-for-each
            (response.body.data as BaseEntity[]).forEach((d, idx, arr) => {
                if (idx === 0) {
                    return;
                }
                expect(d.id).toBeLessThan(arr[idx - 1].id);
            });

            (response.body.data as BaseEntity[]).reduce((pre, value) => {
                if (!pre) {
                    return value;
                }
                expect(value.id).toBeLessThan(pre.id);
                return value;
            });
        });

        it('should return next 20 entities after cursor in descending order', async () => {
            const firstResponse = await request(app.getHttpServer()).get('/sort-desc').expect(HttpStatus.OK);
            const nextResponse = await request(app.getHttpServer()).get('/sort-desc').query({
                nextCursor: firstResponse.body.metadata.nextCursor,
            });

            expect(nextResponse.statusCode).toEqual(HttpStatus.OK);
            expect(nextResponse.body.data).toHaveLength(defaultLimit);
            expect(nextResponse.body.metadata.nextCursor).toBeDefined();
            expect(nextResponse.body.metadata.limit).toEqual(defaultLimit);

            expect(firstResponse.body.metadata.nextCursor).not.toEqual(nextResponse.body.metadata.nextCursor);

            const lastOneOfFirstResponse = firstResponse.body.data.pop();
            const firstOneOfNextResponse = nextResponse.body.data.shift();
            expect(lastOneOfFirstResponse.id - 1).toEqual(firstOneOfNextResponse.id);
            expect(lastOneOfFirstResponse.name).not.toEqual(firstOneOfNextResponse.name);

            // eslint-disable-next-line unicorn/no-array-for-each
            (nextResponse.body.data as BaseEntity[]).forEach((d, idx, arr) => {
                if (idx === 0) {
                    return;
                }
                expect(d.id).toBeLessThan(arr[idx - 1].id);
            });

            (nextResponse.body.data as BaseEntity[]).reduce((pre, value) => {
                if (!pre) {
                    return value;
                }
                expect(value.id).toBeLessThan(pre.id);
                return value;
            });
        });
    });

    describe('numberOfTake', () => {
        const expectedNumberOfTake = 10;
        it(`should return ${expectedNumberOfTake} entities`, async () => {
            const response = await request(app.getHttpServer()).get('/take');
            expect(response.statusCode).toEqual(HttpStatus.OK);
            expect(response.body.data).toHaveLength(expectedNumberOfTake);
        });
    });
});
