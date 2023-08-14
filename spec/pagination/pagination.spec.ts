import { ConsoleLogger, HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { PaginationModule } from './pagination.module';
import { PaginationType } from '../../src';
import { BaseService } from '../base/base.service';
import { TestHelper } from '../test.helper';

describe('Pagination', () => {
    let app: INestApplication;
    let service: BaseService;
    const totalCount = 100;
    const defaultLimit = 20;

    beforeAll(async () => {
        const logger = new ConsoleLogger();
        logger.setLogLevels(['error']);
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [
                PaginationModule({
                    cursor: { readMany: { paginationType: 'cursor' }, search: { paginationType: 'cursor' } },
                    offset: { readMany: { paginationType: 'offset' }, search: { paginationType: 'offset' } },
                }),
            ],
        })
            .setLogger(logger)
            .compile();
        app = moduleFixture.createNestApplication();

        service = moduleFixture.get<BaseService>(BaseService);
        await app.init();
    });

    beforeEach(async () => {
        await service.repository.delete({});
        await Promise.all(
            Array.from({ length: totalCount }, (_, index) => index).map((number) =>
                service.repository.save(service.repository.create({ name: `name-${number}` })),
            ),
        );
    });

    afterAll(async () => {
        await TestHelper.dropTypeOrmEntityTables();
        await app?.close();
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
            total: 1,
        });
        expect(offsetResponseBody.metadata).toEqual({ page: 1, pages: 1, total: 1, offset: 1, nextCursor: expect.any(String) });

        const { body: nextResponseBody } = await request(app.getHttpServer())
            .get(`/${PaginationType.CURSOR}`)
            .query({
                nextCursor: cursorResponseBody.metadata.nextCursor,
            })
            .expect(HttpStatus.OK);
        const { body: offsetNextResponseBody } = await request(app.getHttpServer())
            .get(`/${PaginationType.OFFSET}`)
            .query({
                nextCursor: offsetResponseBody.metadata.nextCursor,
                offset: offsetResponseBody.metadata.offset,
            })
            .expect(HttpStatus.OK);

        expect(nextResponseBody.data).toEqual(offsetNextResponseBody.data);
        expect(nextResponseBody.data).toHaveLength(0);
        expect(nextResponseBody.metadata.nextCursor).not.toEqual(cursorResponseBody.metadata.nextCursor);
        expect(nextResponseBody.metadata.limit).toEqual(20);
        expect(offsetNextResponseBody.metadata).toEqual({ page: 1, pages: 1, total: 1, offset: 1, nextCursor: expect.any(String) });
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
                total: totalCount - defaultLimit,
            });

            const lastOneOfFirstResponse = firstResponseBody.data.pop();
            const firstOneOfNextResponse = nextResponseBody.data.shift();
            expect(lastOneOfFirstResponse.id - 1).toEqual(firstOneOfNextResponse.id);
            expect(lastOneOfFirstResponse.name).not.toEqual(firstOneOfNextResponse.name);
        });

        it('should be keep query condition to next request', async () => {
            await Promise.all(
                Array.from({ length: 100 }).map((_) =>
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
                total: totalCount,
            });

            const { body: nextResponseBody } = await request(app.getHttpServer())
                .get(`/${PaginationType.CURSOR}`)
                .query({
                    nextCursor: responseBody.metadata.nextCursor,
                })
                .expect(HttpStatus.OK);

            expect(nextResponseBody.data).toHaveLength(20);
            expect(nextResponseBody.metadata).toEqual({
                nextCursor: expect.any(String),
                limit: defaultLimit,
                total: totalCount - defaultLimit,
            });
            expect(nextResponseBody.metadata.nextCursor).not.toEqual(responseBody.metadata.nextCursor);

            for (const { name } of responseBody.data) expect(name).toEqual('same name');
            for (const { name } of nextResponseBody.data) expect(name).toEqual('same name');

            const nextDataIds = new Set((nextResponseBody.data as Array<{ id: string }>).map(({ id }) => id));
            expect((responseBody.data as Array<{ id: string }>).some(({ id }) => nextDataIds.has(id))).not.toBeTruthy();
        });

        it('should be calculate the number of entities', async () => {
            const {
                body: { metadata: metadataAll },
            } = await request(app.getHttpServer()).get(`/${PaginationType.CURSOR}`).query({}).expect(HttpStatus.OK);
            expect(metadataAll.total).toEqual(totalCount);

            const {
                body: { metadata },
            } = await request(app.getHttpServer())
                .get(`/${PaginationType.CURSOR}`)
                .query({
                    name: 'name-1',
                })
                .expect(HttpStatus.OK);
            expect(metadata.total).toEqual(1);
        });
    });

    describe('Offset', () => {
        it('should return 20 entities as default', async () => {
            const { body } = await request(app.getHttpServer()).get(`/${PaginationType.OFFSET}`).expect(HttpStatus.OK);
            expect(body.data).toHaveLength(defaultLimit);
            expect(body.metadata).toEqual({ page: 1, pages: 5, total: 100, offset: defaultLimit, nextCursor: expect.any(String) });

            const { body: searchBody } = await request(app.getHttpServer()).post(`/${PaginationType.OFFSET}/search`).expect(HttpStatus.OK);
            expect(searchBody.data).toHaveLength(defaultLimit);
            expect(searchBody.metadata).toEqual({ page: 1, pages: 5, total: 100, offset: defaultLimit, nextCursor: expect.any(String) });
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
                total: 100,
                offset: defaultLimit,
                nextCursor: expect.any(String),
            });

            expect(nextResponseBody.metadata).toEqual({
                page: 2,
                pages: 5,
                total: 100,
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
                total: 100,
                offset: defaultLimit,
                nextCursor: expect.any(String),
            });

            expect(nextResponseBody.metadata).toEqual({
                page: 2,
                pages: 5,
                total: 100,
                offset: defaultLimit * 2,
                nextCursor: expect.any(String),
            });
        });

        it('should be keep query condition to next request', async () => {
            await Promise.all(
                Array.from({ length: 100 }).map((_) =>
                    request(app.getHttpServer()).post(`/${PaginationType.OFFSET}`).send({ name: 'same name' }).expect(HttpStatus.CREATED),
                ),
            );

            // readMany
            const { body: readManyResponseBody } = await request(app.getHttpServer())
                .get(`/${PaginationType.OFFSET}`)
                .query({ name: 'same name' })
                .expect(HttpStatus.OK);

            const { body: readManyNextResponseBody } = await request(app.getHttpServer())
                .get(`/${PaginationType.OFFSET}`)
                .query({
                    nextCursor: readManyResponseBody.metadata.nextCursor,
                    offset: readManyResponseBody.metadata.offset,
                })
                .expect(HttpStatus.OK);

            expect(readManyResponseBody.metadata).toEqual({
                page: 1,
                pages: 5,
                total: 100,
                offset: 20,
                nextCursor: expect.any(String),
            });
            expect(readManyNextResponseBody.metadata).toEqual({
                page: 2,
                pages: 5,
                total: 100,
                offset: 40,
                nextCursor: expect.any(String),
            });

            // search
            const { body: searchResponseBody } = await request(app.getHttpServer())
                .post(`/${PaginationType.OFFSET}/search`)
                .send({ where: [{ name: { operator: '=', operand: 'same name' } }] })
                .expect(HttpStatus.OK);
            const searchDataSet = new Set<number>();
            for (const data of searchResponseBody.data) {
                searchDataSet.add(data.id);
                expect(data.name).toEqual('same name');
            }

            const { body: searchNextResponseBody } = await request(app.getHttpServer())
                .post(`/${PaginationType.OFFSET}/search`)
                .send({ nextCursor: searchResponseBody.metadata.nextCursor, offset: searchResponseBody.metadata.offset })
                .expect(HttpStatus.OK);
            expect(searchNextResponseBody.metadata).toEqual({
                page: 2,
                pages: 5,
                total: 100,
                offset: 40,
                nextCursor: expect.any(String),
            });

            for (const data of searchNextResponseBody.data) {
                expect(data.name).toEqual('same name');
                expect(searchDataSet.has(data.id)).not.toBeTruthy();
            }

            const { body: searchNextNextResponseBody } = await request(app.getHttpServer())
                .post(`/${PaginationType.OFFSET}/search`)
                .send({ nextCursor: searchNextResponseBody.metadata.nextCursor, offset: searchNextResponseBody.metadata.offset })
                .expect(HttpStatus.OK);
            expect(searchNextNextResponseBody.metadata).toEqual({
                page: 3,
                pages: 5,
                total: 100,
                offset: 60,
                nextCursor: expect.any(String),
            });
            for (const data of searchNextResponseBody.data) {
                expect(data.name).toEqual('same name');
                expect(searchDataSet.has(data.id)).not.toBeTruthy();
            }
        });

        it('should be able to set limit only at first request', async () => {
            const limit = 15;
            const { body: responseBody } = await request(app.getHttpServer())
                .get(`/${PaginationType.OFFSET}`)
                .query({ limit })
                .expect(HttpStatus.OK);
            expect(responseBody.data).toHaveLength(limit);
            expect(responseBody.metadata).toEqual({ page: 1, pages: 7, total: 100, offset: limit, nextCursor: expect.any(String) });

            const { body: nextResponseBody } = await request(app.getHttpServer())
                .get(`/${PaginationType.OFFSET}`)
                .query({
                    nextCursor: responseBody.metadata.nextCursor,
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
                nextCursor: expect.any(String),
            });
        });

        it('should be able to set query, offset and limit after first request', async () => {
            const limit = 15;
            const { body: firstResponseBody } = await request(app.getHttpServer()).get(`/${PaginationType.OFFSET}`).expect(HttpStatus.OK);
            const { body: nextResponseBody } = await request(app.getHttpServer())
                .get(`/${PaginationType.OFFSET}`)
                .query({
                    nextCursor: firstResponseBody.metadata.nextCursor,
                    offset: firstResponseBody.metadata.offset,
                    limit,
                })
                .expect(HttpStatus.OK);

            expect(firstResponseBody.data).toHaveLength(defaultLimit);
            expect(nextResponseBody.data).toHaveLength(limit);
            expect(firstResponseBody.metadata).toEqual({
                page: 1,
                pages: 5,
                total: 100,
                offset: defaultLimit,
                nextCursor: expect.any(String),
            });
            expect(nextResponseBody.metadata).toEqual({
                page: 2,
                pages: Math.ceil(100 / limit),
                total: 100,
                offset: defaultLimit + limit,
                nextCursor: expect.any(String),
            });

            const lastOneOfFirstResponse = firstResponseBody.data.pop();
            const firstOneOfNextResponse = nextResponseBody.data.shift();

            expect(lastOneOfFirstResponse.id - 1).toEqual(firstOneOfNextResponse.id);
            expect(lastOneOfFirstResponse.name).not.toEqual(firstOneOfNextResponse.name);
        });

        it('should be calculate the number of entities', async () => {
            const {
                body: { metadata: metadataAll },
            } = await request(app.getHttpServer()).get(`/${PaginationType.OFFSET}`).query({ limit: 15 }).expect(HttpStatus.OK);
            expect(metadataAll.total).toEqual(totalCount);

            const {
                body: { metadata },
            } = await request(app.getHttpServer()).get(`/${PaginationType.OFFSET}`).query({ name: 'name-1' }).expect(HttpStatus.OK);
            expect(metadata.total).toEqual(1);
        });
    });
});
