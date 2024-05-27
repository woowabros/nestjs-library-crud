import { ConsoleLogger, HttpStatus } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { ViewEntityPaginationModule } from './view-entity-pagination.module';
import { PaginationType } from '../../src';
import { BaseService } from '../base/base.service';
import { TestHelper } from '../test.helper';

import type { INestApplication } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';

describe('Pagination with paginationKeys option', () => {
    let app: INestApplication;
    let baseEntityService: BaseService;
    const totalCount = 100;
    const defaultLimit = 20;

    beforeAll(async () => {
        const logger = new ConsoleLogger();
        logger.setLogLevels(['error']);
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [
                ViewEntityPaginationModule({
                    cursor: {
                        readMany: { paginationType: 'cursor', numberOfTake: defaultLimit, paginationKeys: ['name'] },
                        search: { paginationType: 'cursor', numberOfTake: defaultLimit, paginationKeys: ['name'] },
                    },
                    offset: {
                        readMany: { paginationType: 'offset', numberOfTake: defaultLimit, paginationKeys: ['name'] },
                        search: { paginationType: 'offset', numberOfTake: defaultLimit, paginationKeys: ['name'] },
                    },
                }),
            ],
        })
            .setLogger(logger)
            .compile();
        app = moduleFixture.createNestApplication();

        baseEntityService = moduleFixture.get<BaseService>(BaseService);
        await app.init();
    });

    beforeEach(async () => {
        await baseEntityService.repository.delete({});
        await baseEntityService.repository.save(
            Array.from({ length: totalCount }, (_, index) => index).map((number) => ({
                name: `name-${(number + 1).toString().padStart(3, '0')}`,
                type: number,
            })),
        );
    });

    afterAll(async () => {
        await TestHelper.dropTypeOrmEntityTables();
        await app?.close();
    });

    describe('Cursor', () => {
        it('should return 20 entities as default', async () => {
            const { body: cursorBody } = await request(app.getHttpServer()).get(`/${PaginationType.CURSOR}`).expect(HttpStatus.OK);

            expect(cursorBody.data).toHaveLength(defaultLimit);
            expect(cursorBody.metadata).toEqual({
                nextCursor: expect.any(String),
                limit: defaultLimit,
                total: totalCount,
            });

            const { body: searchBody } = await request(app.getHttpServer())
                .post(`/${PaginationType.CURSOR}/search`)
                .send()
                .expect(HttpStatus.OK);
            expect(searchBody.data).toHaveLength(defaultLimit);
            expect(searchBody.metadata).toEqual({ limit: defaultLimit, total: totalCount, nextCursor: expect.any(String) });

            const { body: searchNextBody } = await request(app.getHttpServer())
                .post(`/${PaginationType.CURSOR}/search`)
                .send({ nextCursor: searchBody.metadata.nextCursor, offset: defaultLimit })
                .expect(HttpStatus.OK);
            for (const entity of searchNextBody.data) {
                expect(searchBody.data.some((data: { id: number }) => data.id === entity.id)).not.toBeTruthy();
            }
        });

        it('should sort by pagination keys', async () => {
            const { body: firstResponseBody } = await request(app.getHttpServer()).get(`/${PaginationType.CURSOR}`).expect(HttpStatus.OK);
            expect(firstResponseBody.data).toHaveLength(defaultLimit);
            for (const number of Array.from({ length: defaultLimit }, (_, index) => index)) {
                expect(firstResponseBody.data[number].name).toEqual(`name-${(totalCount - number).toString().padStart(3, '0')}`);
            }
        });

        it('should return next 20 entities after cursor', async () => {
            const { body: firstResponseBody } = await request(app.getHttpServer()).get(`/${PaginationType.CURSOR}`).expect(HttpStatus.OK);

            const { body: nextResponseBody } = await request(app.getHttpServer())
                .get(`/${PaginationType.CURSOR}`)
                .query({
                    nextCursor: firstResponseBody.metadata.nextCursor,
                })
                .expect(HttpStatus.OK);

            expect(firstResponseBody.metadata.nextCursor).not.toEqual(nextResponseBody.metadata.nextCursor);

            expect(nextResponseBody.data).toHaveLength(defaultLimit);
            expect(nextResponseBody.metadata).toEqual({
                nextCursor: expect.any(String),
                limit: defaultLimit,
                total: totalCount,
            });

            for (const entity of nextResponseBody.data) {
                expect(firstResponseBody.data.some((data: { id: number }) => data.id === entity.id)).not.toBeTruthy();
            }

            const lastOneOfFirstResponse = firstResponseBody.data.pop();
            const firstOneOfNextResponse = nextResponseBody.data.shift();
            expect(lastOneOfFirstResponse.id - 1).toEqual(firstOneOfNextResponse.id);
            expect(lastOneOfFirstResponse.name).not.toEqual(firstOneOfNextResponse.name);
        });

        it('should return next 20 entities after cursor with order', async () => {
            const { body: firstResponseBody } = await request(app.getHttpServer())
                .post(`/${PaginationType.CURSOR}/search`)
                .send({ order: { category: 'ASC' }, limit: 50 })
                .expect(HttpStatus.OK);

            const { body: nextResponseBody } = await request(app.getHttpServer())
                .post(`/${PaginationType.CURSOR}/search`)
                .send({
                    nextCursor: firstResponseBody.metadata.nextCursor,
                })
                .expect(HttpStatus.OK);

            expect(firstResponseBody.metadata.nextCursor).not.toEqual(nextResponseBody.metadata.nextCursor);

            expect(nextResponseBody.data).toHaveLength(defaultLimit);
            expect(nextResponseBody.metadata).toEqual({
                nextCursor: expect.any(String),
                limit: defaultLimit,
                total: totalCount,
            });

            const lastOneOfFirstResponse = firstResponseBody.data.pop();
            const firstOneOfNextResponse = nextResponseBody.data.shift();
            expect(lastOneOfFirstResponse.category).toEqual(0);
            expect(firstOneOfNextResponse.category).toEqual(1);
        });
    });

    describe('Offset', () => {
        it('should return 20 entities as default', async () => {
            const { body } = await request(app.getHttpServer()).get(`/${PaginationType.OFFSET}`).expect(HttpStatus.OK);
            expect(body.data).toHaveLength(defaultLimit);
            expect(body.metadata).toEqual({ page: 1, pages: 5, total: totalCount, offset: defaultLimit, nextCursor: expect.any(String) });

            const { body: searchBody } = await request(app.getHttpServer()).post(`/${PaginationType.OFFSET}/search`).expect(HttpStatus.OK);
            expect(searchBody.data).toHaveLength(defaultLimit);
            expect(searchBody.metadata).toEqual({
                page: 1,
                pages: 5,
                total: totalCount,
                offset: defaultLimit,
                nextCursor: expect.any(String),
            });

            const { body: searchNextBody } = await request(app.getHttpServer())
                .post(`/${PaginationType.OFFSET}/search`)
                .send({ nextCursor: body.metadata.nextCursor, offset: defaultLimit })
                .expect(HttpStatus.OK);
            for (const entity of searchNextBody.data) {
                expect(searchBody.data.some((data: { id: number }) => data.id === entity.id)).not.toBeTruthy();
            }
        });

        it('should return next page from offset on readMany', async () => {
            const { body: firstResponseBody } = await request(app.getHttpServer()).get(`/${PaginationType.OFFSET}`).expect(HttpStatus.OK);

            const { body: nextResponseBody } = await request(app.getHttpServer())
                .get(`/${PaginationType.OFFSET}`)
                .query({
                    nextCursor: firstResponseBody.metadata.nextCursor,
                    offset: firstResponseBody.metadata.offset,
                })
                .expect(HttpStatus.OK);

            expect(firstResponseBody.metadata).toEqual({
                page: 1,
                pages: 5,
                total: totalCount,
                offset: defaultLimit,
                nextCursor: expect.any(String),
            });

            expect(nextResponseBody.metadata).toEqual({
                page: 2,
                pages: 5,
                total: totalCount,
                offset: defaultLimit * 2,
                nextCursor: expect.any(String),
            });
        });

        it('should return next page from offset on search', async () => {
            const { body: firstResponseBody } = await request(app.getHttpServer())
                .post(`/${PaginationType.OFFSET}/search`)
                .expect(HttpStatus.OK);

            const { body: nextResponseBody } = await request(app.getHttpServer())
                .post(`/${PaginationType.OFFSET}/search`)
                .send({
                    nextCursor: firstResponseBody.metadata.nextCursor,
                    offset: firstResponseBody.metadata.offset,
                })
                .expect(HttpStatus.OK);

            expect(firstResponseBody.metadata).toEqual({
                page: 1,
                pages: 5,
                total: totalCount,
                offset: defaultLimit,
                nextCursor: expect.any(String),
            });

            expect(nextResponseBody.metadata).toEqual({
                page: 2,
                pages: 5,
                total: totalCount,
                offset: defaultLimit * 2,
                nextCursor: expect.any(String),
            });
        });

        it('should return next page from offset with order', async () => {
            const { body: firstResponseBody } = await request(app.getHttpServer())
                .post(`/${PaginationType.OFFSET}/search`)
                .send({ order: { category: 'ASC' }, offset: 30 })
                .expect(HttpStatus.OK);

            const { body: nextResponseBody } = await request(app.getHttpServer())
                .post(`/${PaginationType.OFFSET}/search`)
                .send({
                    nextCursor: firstResponseBody.metadata.nextCursor,
                    offset: firstResponseBody.metadata.offset,
                })
                .expect(HttpStatus.OK);

            expect(firstResponseBody.metadata.nextCursor).not.toEqual(nextResponseBody.metadata.nextCursor);

            expect(nextResponseBody.data).toHaveLength(defaultLimit);
            expect(nextResponseBody.metadata).toEqual({
                page: 3,
                pages: 5,
                total: totalCount,
                offset: 70,
                nextCursor: expect.any(String),
            });

            const lastOneOfFirstResponse = firstResponseBody.data.pop();
            const firstOneOfNextResponse = nextResponseBody.data.shift();
            expect(lastOneOfFirstResponse.category).toEqual(0);
            expect(firstOneOfNextResponse.category).toEqual(1);
        });
    });
});
