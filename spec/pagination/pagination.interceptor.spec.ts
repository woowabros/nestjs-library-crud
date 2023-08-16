import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { PaginationModule } from './pagination.module';
import { ReadManyRequestInterceptor } from './read-many.request.interceptor';
import { PaginationType } from '../../src';
import { BaseService } from '../base/base.service';
import { TestHelper } from '../test.helper';

describe('Pagination with interceptor', () => {
    const defaultLimit = 20;
    describe('with ReadMany Interceptor', () => {
        let app: INestApplication;

        beforeAll(async () => {
            const moduleFixture: TestingModule = await Test.createTestingModule({
                imports: [
                    PaginationModule({
                        cursor: {
                            readMany: {
                                paginationType: 'cursor',
                                interceptors: [ReadManyRequestInterceptor],
                            },
                        },
                        offset: {
                            readMany: {
                                paginationType: PaginationType.OFFSET,
                                interceptors: [ReadManyRequestInterceptor],
                            },
                        },
                    }),
                ],
            }).compile();
            app = moduleFixture.createNestApplication();

            const service: BaseService = moduleFixture.get<BaseService>(BaseService);
            await service.repository.save(Array.from({ length: 100 }, (_, index) => index).map((number) => ({ name: `name-${number}` })));
            await app.init();
        });

        afterAll(async () => {
            await TestHelper.dropTypeOrmEntityTables();
            await app?.close();
        });

        it('should be returned deleted entities each interceptor soft-deleted option', async () => {
            const deleteIdList: number[] = Array.from({ length: 100 }, (_, index) => index + 1).filter((number) => number % 2 === 0);
            const { body: responseBodyBeforeDelete } = await request(app.getHttpServer())
                .get(`/${PaginationType.CURSOR}`)
                .expect(HttpStatus.OK);
            const { body: offsetResponseBodyBeforeDelete } = await request(app.getHttpServer())
                .get(`/${PaginationType.OFFSET}`)
                .expect(HttpStatus.OK);

            expect(responseBodyBeforeDelete.data).toEqual(offsetResponseBodyBeforeDelete.data);
            expect(responseBodyBeforeDelete.data).toHaveLength(defaultLimit);

            await Promise.all(
                deleteIdList.map((id) => request(app.getHttpServer()).delete(`/${PaginationType.CURSOR}/${id}`).expect(HttpStatus.OK)),
            );
            const deletedIdSet = new Set(deleteIdList);

            const {
                body: responseBodyAfterDelete,
            }: { body: { data: Array<{ id: number; deletedAt?: unknown }>; metadata: { nextCursor: unknown } } } = await request(
                app.getHttpServer(),
            )
                .get(`/${PaginationType.CURSOR}`)
                .expect(HttpStatus.OK);
            const { body: offsetResponseBodyAfterDelete } = await request(app.getHttpServer())
                .get(`/${PaginationType.OFFSET}`)
                .expect(HttpStatus.OK);
            expect(responseBodyAfterDelete.data).toEqual(offsetResponseBodyAfterDelete.data);

            expect(responseBodyAfterDelete.data).toHaveLength(defaultLimit);
            expect(responseBodyAfterDelete.data.some(({ id }) => deletedIdSet.has(id))).toBeTruthy();

            let index = 0;
            for (const data of responseBodyAfterDelete.data) {
                const beforeData = responseBodyBeforeDelete.data[index++];
                if (data.id % 2 === 0) {
                    expect(data.deletedAt).not.toEqual(beforeData.deletedAt);
                    expect(data).toEqual({ ...beforeData, lastModifiedAt: expect.any(String), deletedAt: expect.any(String) });
                } else {
                    expect(data).toEqual(beforeData);
                }
            }

            const { body: nextResponseBody } = await request(app.getHttpServer())
                .get(`/${PaginationType.CURSOR}`)
                .query({
                    nextCursor: responseBodyAfterDelete.metadata.nextCursor,
                })
                .expect(HttpStatus.OK);
            const { body: offsetNextResponseBody } = await request(app.getHttpServer())
                .get(`/${PaginationType.OFFSET}`)
                .query({
                    nextCursor: offsetResponseBodyAfterDelete.metadata.nextCursor,
                    offset: offsetResponseBodyAfterDelete.metadata.offset,
                })
                .expect(HttpStatus.OK);
            expect(offsetNextResponseBody.data).toEqual(nextResponseBody.data);

            for (const data of nextResponseBody.data) {
                if (data.id % 2 === 0) {
                    expect(data.deletedAt).not.toEqual(null);
                } else {
                    expect(data.deletedAt).toEqual(null);
                }
            }
        });
    });

    describe('without ReadMany Interceptor', () => {
        let app: INestApplication;

        beforeAll(async () => {
            const moduleFixture: TestingModule = await Test.createTestingModule({
                imports: [
                    PaginationModule({
                        cursor: {
                            readMany: {
                                paginationType: 'cursor',
                                interceptors: [],
                            },
                        },
                        offset: {
                            readMany: {
                                paginationType: 'offset',
                                interceptors: [],
                            },
                        },
                    }),
                ],
            }).compile();
            app = moduleFixture.createNestApplication();

            const service: BaseService = moduleFixture.get<BaseService>(BaseService);
            await service.repository.save(Array.from({ length: 100 }, (_, index) => index).map((number) => ({ name: `name-${number}` })));
            await app.init();
        });

        afterAll(async () => {
            await TestHelper.dropTypeOrmEntityTables();
            await app?.close();
        });

        it('should be returned deleted entities each interceptor soft-deleted option', async () => {
            const { body: responseBodyBeforeDelete }: { body: { data: Array<{ id: number }> } } = await request(app.getHttpServer())
                .get(`/${PaginationType.CURSOR}`)
                .expect(HttpStatus.OK);
            const { body: offsetResponseBodyBeforeDelete } = await request(app.getHttpServer())
                .get(`/${PaginationType.OFFSET}`)
                .expect(HttpStatus.OK);

            expect(responseBodyBeforeDelete.data).toEqual(offsetResponseBodyBeforeDelete.data);
            expect(responseBodyBeforeDelete.data).toHaveLength(defaultLimit);

            const deleteIdList: number[] = responseBodyBeforeDelete.data.filter(({ id }) => id % 2 === 0).map(({ id }) => id);
            await Promise.all(
                deleteIdList.map((id) => request(app.getHttpServer()).delete(`/${PaginationType.CURSOR}/${id}`).expect(HttpStatus.OK)),
            );
            const deletedIdSet = new Set(deleteIdList);

            const { body: responseBodyAfterDelete }: { body: { data: Array<{ id: number }> } } = await request(app.getHttpServer())
                .get(`/${PaginationType.CURSOR}`)
                .expect(HttpStatus.OK);
            const { body: offsetResponseBodyAfterDelete } = await request(app.getHttpServer())
                .get(`/${PaginationType.OFFSET}`)
                .expect(HttpStatus.OK);
            expect(responseBodyAfterDelete.data).toEqual(offsetResponseBodyAfterDelete.data);

            expect(responseBodyAfterDelete.data).toHaveLength(defaultLimit);
            expect(responseBodyAfterDelete.data.some(({ id }) => deletedIdSet.has(id))).not.toBeTruthy();
        });
    });
});
