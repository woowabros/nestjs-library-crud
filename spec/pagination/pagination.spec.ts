import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import _ from 'lodash';
import request from 'supertest';

import { PaginationModule } from './pagination.module';
import { PaginationType } from '../../src';
import { BaseService } from '../base/base.service';

describe('Pagination', () => {
    let app: INestApplication;
    const defaultLimit = 20;

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [
                PaginationModule({
                    cursor: { readMany: { paginationType: 'cursor' } },
                    offset: { readMany: { paginationType: 'offset' } },
                }),
            ],
        }).compile();
        app = moduleFixture.createNestApplication();

        const service: BaseService = moduleFixture.get<BaseService>(BaseService);
        await Promise.all(_.range(100).map((number) => service.repository.save(service.repository.create({ name: `name-${number}` }))));
        await app.init();
    });

    afterAll(async () => {
        if (app) {
            await app.close();
        }
    });

    it('should return UNPROCESSABLE_ENTITY when query is invalid', async () => {
        for (const paginationType of Object.values(PaginationType)) {
            await request(app.getHttpServer())
                .get(`/${paginationType}`)
                .query({ name: ['name-29', 'name-30'] })
                .expect(HttpStatus.UNPROCESSABLE_ENTITY);

            await request(app.getHttpServer()).get(`/${paginationType}`).query({ age: 20 }).expect(HttpStatus.UNPROCESSABLE_ENTITY);
        }
    });

    it('should return entities which meet filter in query regardless of pagination type', async () => {
        const { body: cursorResponseBody } = await request(app.getHttpServer())
            .get(`/${PaginationType.CURSOR}`)
            .query({ name: 'name-29' })
            .expect(HttpStatus.OK);
        const { body: offsetResponseBody } = await request(app.getHttpServer())
            .get(`/${PaginationType.OFFSET}`)
            .query({ name: 'name-29' })
            .expect(HttpStatus.OK);

        expect(cursorResponseBody.data).toEqual(offsetResponseBody.data);
        expect(cursorResponseBody.data).toHaveLength(1);
        expect(cursorResponseBody.metadata).toEqual({
            nextCursor: expect.any(String),
            limit: defaultLimit,
            query: expect.any(String),
        });
        expect(offsetResponseBody.metadata).toEqual({ page: 1, pages: 1, total: 1, offset: 1, query: expect.any(String) });

        const { body: nextResponseBody } = await request(app.getHttpServer())
            .get(`/${PaginationType.CURSOR}`)
            .query({
                nextCursor: cursorResponseBody.metadata.nextCursor,
                query: cursorResponseBody.metadata.query,
            })
            .expect(HttpStatus.OK);
        const { body: offsetNextResponseBody } = await request(app.getHttpServer())
            .get(`/${PaginationType.OFFSET}`)
            .query({
                query: offsetResponseBody.metadata.query,
                offset: offsetResponseBody.metadata.offset,
            })
            .expect(HttpStatus.OK);

        expect(nextResponseBody.data).toEqual(offsetNextResponseBody.data);
        expect(nextResponseBody.data).toHaveLength(0);
        expect(nextResponseBody.metadata.nextCursor).not.toEqual(cursorResponseBody.metadata.nextCursor);
        expect(nextResponseBody.metadata.limit).toEqual(20);
        expect(nextResponseBody.metadata.query).toEqual(cursorResponseBody.metadata.query);
        expect(offsetNextResponseBody.metadata).toEqual({ page: 1, pages: 1, total: 1, offset: 1, query: expect.any(String) });
    });

    describe('Cursor', () => {
        it('should return 20 entities as default', async () => {
            const { body: cursorBody } = await request(app.getHttpServer()).get(`/${PaginationType.CURSOR}`).expect(HttpStatus.OK);

            expect(cursorBody.data).toHaveLength(defaultLimit);
            expect(cursorBody.metadata).toEqual({
                nextCursor: expect.any(String),
                limit: defaultLimit,
                query: expect.any(String),
            });
        });

        it('should return next 20 entities after cursor', async () => {
            const { body: firstResponseBody } = await request(app.getHttpServer()).get(`/${PaginationType.CURSOR}`).expect(HttpStatus.OK);

            const { body: nextResponseBody } = await request(app.getHttpServer())
                .get(`/${PaginationType.CURSOR}`)
                .query({
                    nextCursor: firstResponseBody.metadata.nextCursor,
                    query: firstResponseBody.metadata.query,
                })
                .expect(HttpStatus.OK);

            expect(firstResponseBody.metadata.nextCursor).not.toEqual(nextResponseBody.metadata.nextCursor);

            expect(nextResponseBody.data).toHaveLength(defaultLimit);
            expect(nextResponseBody.metadata).toEqual({
                nextCursor: expect.any(String),
                limit: defaultLimit,
                query: expect.any(String),
            });

            const lastOneOfFirstResponse = firstResponseBody.data.pop();
            const firstOneOfNextResponse = nextResponseBody.data.shift();
            expect(lastOneOfFirstResponse.id - 1).toEqual(firstOneOfNextResponse.id);
            expect(lastOneOfFirstResponse.name).not.toEqual(firstOneOfNextResponse.name);
        });

        it('should be keep query condition to next request', async () => {
            await Promise.all(
                _.range(100).map((_n) =>
                    request(app.getHttpServer()).post(`/${PaginationType.CURSOR}`).send({ name: 'same name' }).expect(HttpStatus.CREATED),
                ),
            );

            const { body: responseBody } = await request(app.getHttpServer())
                .get(`/${PaginationType.CURSOR}`)
                .query({
                    name: 'same name',
                })
                .expect(HttpStatus.OK);

            expect(responseBody.data).toHaveLength(20);
            expect(responseBody.metadata).toEqual({
                nextCursor: expect.any(String),
                limit: defaultLimit,
                query: expect.any(String),
            });

            const { body: nextResponseBody } = await request(app.getHttpServer())
                .get(`/${PaginationType.CURSOR}`)
                .query({
                    nextCursor: responseBody.metadata.nextCursor,
                    query: responseBody.metadata.query,
                })
                .expect(HttpStatus.OK);

            expect(nextResponseBody.data).toHaveLength(20);
            expect(nextResponseBody.metadata).toEqual({
                nextCursor: expect.any(String),
                limit: defaultLimit,
                query: responseBody.metadata.query,
            });
            expect(nextResponseBody.metadata.nextCursor).not.toEqual(responseBody.metadata.nextCursor);

            for (const { name } of responseBody.data) expect(name).toEqual('same name');
            for (const { name } of nextResponseBody.data) expect(name).toEqual('same name');

            const nextDataIds = new Set(nextResponseBody.data.map(({ id }) => id));
            expect(responseBody.data.some(({ id }) => nextDataIds.has(id))).not.toBeTruthy();
        });

        it('should throw when offset pagination query provided', async () => {
            const { body: responseBody } = await request(app.getHttpServer()).get(`/${PaginationType.OFFSET}`).expect(HttpStatus.OK);

            await request(app.getHttpServer())
                .get(`/${PaginationType.CURSOR}`)
                .query({
                    query: responseBody.metadata.query,
                    offset: responseBody.metadata.offset,
                    limit: 15,
                })
                .expect(HttpStatus.UNPROCESSABLE_ENTITY);
        });
    });

    describe('Offset', () => {
        it('should return 20 entities as default', async () => {
            const { body } = await request(app.getHttpServer()).get(`/${PaginationType.OFFSET}`).expect(HttpStatus.OK);
            expect(body.data).toHaveLength(defaultLimit);
            expect(body.metadata).toEqual({ page: 1, pages: 5, total: 100, offset: defaultLimit, query: expect.any(String) });
        });

        it('should return next page from offset', async () => {
            const { body: firstResponseBody } = await request(app.getHttpServer()).get(`/${PaginationType.OFFSET}`).expect(HttpStatus.OK);

            const { body: nextResponseBody } = await request(app.getHttpServer())
                .get(`/${PaginationType.OFFSET}`)
                .query({
                    query: firstResponseBody.metadata.query,
                    offset: firstResponseBody.metadata.offset,
                })
                .expect(HttpStatus.OK);

            expect(firstResponseBody.metadata).toEqual({
                page: 1,
                pages: 5,
                total: 100,
                offset: defaultLimit,
                query: expect.any(String),
            });

            expect(nextResponseBody.metadata).toEqual({
                page: 2,
                pages: 5,
                total: 100,
                offset: defaultLimit * 2,
                query: expect.any(String),
            });
        });

        it('should be keep query condition to next request', async () => {
            await Promise.all(
                _.range(100).map((_n) =>
                    request(app.getHttpServer()).post(`/${PaginationType.OFFSET}`).send({ name: 'same name' }).expect(HttpStatus.CREATED),
                ),
            );

            const { body: responseBody } = await request(app.getHttpServer())
                .get(`/${PaginationType.OFFSET}`)
                .query({ name: 'same name' })
                .expect(HttpStatus.OK);

            const { body: nextResponseBody } = await request(app.getHttpServer())
                .get(`/${PaginationType.OFFSET}`)
                .query({
                    query: responseBody.metadata.query,
                    offset: responseBody.metadata.offset,
                })
                .expect(HttpStatus.OK);

            expect(nextResponseBody.metadata).toHaveProperty('query', responseBody.metadata.query);
        });

        it('should be able to set limit only at first request', async () => {
            const limit = 15;
            const { body: responseBody } = await request(app.getHttpServer())
                .get(`/${PaginationType.OFFSET}`)
                .query({ limit })
                .expect(HttpStatus.OK);
            expect(responseBody.data).toHaveLength(limit);
            expect(responseBody.metadata).toEqual({ page: 1, pages: 7, total: 100, offset: limit, query: expect.any(String) });

            const { body: nextResponseBody } = await request(app.getHttpServer())
                .get(`/${PaginationType.OFFSET}`)
                .query({
                    query: responseBody.metadata.query,
                    offset: responseBody.metadata.offset,
                    limit,
                })
                .expect(HttpStatus.OK);
            expect(nextResponseBody.data).toHaveLength(limit);
            expect(nextResponseBody.metadata).toEqual({
                page: 2,
                pages: 7,
                total: 100,
                offset: limit * 2,
                query: responseBody.metadata.query,
            });
        });

        it('should be able to set query, offset and limit after first request', async () => {
            const limit = 15;
            const { body: firstResponseBody } = await request(app.getHttpServer()).get(`/${PaginationType.OFFSET}`).expect(HttpStatus.OK);
            const { body: nextResponseBody } = await request(app.getHttpServer())
                .get(`/${PaginationType.OFFSET}`)
                .query({
                    query: firstResponseBody.metadata.query,
                    offset: firstResponseBody.metadata.offset,
                    limit,
                })
                .expect(HttpStatus.OK);

            expect(firstResponseBody.data).toHaveLength(defaultLimit);
            expect(nextResponseBody.data).toHaveLength(limit);
            expect(firstResponseBody.metadata).toEqual({ page: 1, pages: 5, total: 100, offset: defaultLimit, query: expect.any(String) });
            expect(nextResponseBody.metadata).toEqual({
                page: 2,
                pages: Math.ceil(100 / limit),
                total: 100,
                offset: defaultLimit + limit,
                query: firstResponseBody.metadata.query,
            });

            const lastOneOfFirstResponse = firstResponseBody.data.pop();
            const firstOneOfNextResponse = nextResponseBody.data.shift();

            expect(lastOneOfFirstResponse.id - 1).toEqual(firstOneOfNextResponse.id);
            expect(lastOneOfFirstResponse.name).not.toEqual(firstOneOfNextResponse.name);
        });
    });
});
