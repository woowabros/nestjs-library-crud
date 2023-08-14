/* eslint-disable max-classes-per-file */
import { Request } from 'express';
import { Entity, PrimaryGeneratedColumn } from 'typeorm';

import { RequestAbstractInterceptor } from './abstract.request.interceptor';
import { CrudAbstractEntity } from '../../../spec/crud.abstract.entity';
import { CrudOptions, Method } from '../interface';
import { ExecutionContextHost } from '../provider';
import { CrudLogger } from '../provider/crud-logger';

describe('RequestAbstractInterceptor', () => {
    let fooInterceptor: RequestAbstractInterceptor;
    let req: Request;

    @Entity('test')
    class TestEntity extends CrudAbstractEntity {
        @PrimaryGeneratedColumn()
        id: number;
    }

    beforeAll(() => {
        class FooInterceptor extends RequestAbstractInterceptor {
            constructor(crudLogger: CrudLogger) {
                super(crudLogger);
            }
        }

        fooInterceptor = new FooInterceptor(new CrudLogger());

        const context = new ExecutionContextHost([{}]);
        req = context.switchToHttp().getRequest<Request>();
    });

    describe('should have the author information in the request object', () => {
        const crudOptions: CrudOptions = {
            entity: TestEntity,
            routes: {
                create: { author: { filter: 'user1', property: 'createdBy' } },
                update: { author: { filter: 'user2', property: 'updatedBy' } },
                upsert: { author: { filter: 'user3', property: 'upsertedBy' } },
                delete: { author: { filter: 'user4', property: 'deletedBy' } },
                recover: { author: { filter: 'user5', property: 'deletedBy', value: null } },
            },
        };

        test('when `create` request has been made', async () => {
            const result = fooInterceptor.getAuthor(req, crudOptions, Method.CREATE);
            expect(result).toEqual({ filter: 'user1', property: 'createdBy' });
        });

        test('when `update` request has been made', async () => {
            const result = fooInterceptor.getAuthor(req, crudOptions, Method.UPDATE);
            expect(result).toEqual({ filter: 'user2', property: 'updatedBy' });
        });

        test('when `upsert` request has been made', async () => {
            const result = fooInterceptor.getAuthor(req, crudOptions, Method.UPSERT);
            expect(result).toEqual({ filter: 'user3', property: 'upsertedBy' });
        });

        test('when `delete` request has been made', async () => {
            const result = fooInterceptor.getAuthor(req, crudOptions, Method.DELETE);
            expect(result).toEqual({ filter: 'user4', property: 'deletedBy' });
        });

        test('when `recover` request has been made', async () => {
            const result = fooInterceptor.getAuthor(req, crudOptions, Method.RECOVER);
            expect(result).toEqual({ filter: 'user5', property: 'deletedBy', value: null });
        });

        test('when `read` request has been made', async () => {
            // enforce to pass `Method` which are not allowed as the third argument
            const resultOfReadOne = fooInterceptor.getAuthor(req, crudOptions, Method.READ_ONE as any);
            expect(resultOfReadOne).toBeUndefined();

            const resultOfReadMany = fooInterceptor.getAuthor(req, crudOptions, Method.READ_MANY as any);
            expect(resultOfReadMany).toBeUndefined();

            const resultOfSearch = fooInterceptor.getAuthor(req, crudOptions, Method.SEARCH as any);
            expect(resultOfSearch).toBeUndefined();
        });
    });

    describe('should have the author information in the request object', () => {
        const crudOptionsWithoutFilter: CrudOptions = {
            entity: TestEntity,
            routes: {
                create: { author: { property: 'createdBy' } },
                update: { author: { property: 'updatedBy' } },
                upsert: { author: { property: 'upsertedBy' } },
                delete: { author: { property: 'deletedBy' } },
                recover: { author: { property: 'deletedBy', value: null } },
            },
        };

        test('when `create` request has been made', async () => {
            const result = fooInterceptor.getAuthor(req, crudOptionsWithoutFilter, Method.CREATE);
            expect(result).toEqual({ property: 'createdBy' });
        });

        test('when `update` request has been made', async () => {
            const result = fooInterceptor.getAuthor(req, crudOptionsWithoutFilter, Method.UPDATE);
            expect(result).toEqual({ property: 'updatedBy' });
        });

        test('when `upsert` request has been made', async () => {
            const result = fooInterceptor.getAuthor(req, crudOptionsWithoutFilter, Method.UPSERT);
            expect(result).toEqual({ property: 'upsertedBy' });
        });

        test('when `delete` request has been made', async () => {
            const result = fooInterceptor.getAuthor(req, crudOptionsWithoutFilter, Method.DELETE);
            expect(result).toEqual({ property: 'deletedBy' });
        });

        test('when `recover` request has been made', async () => {
            const result = fooInterceptor.getAuthor(req, crudOptionsWithoutFilter, Method.RECOVER);
            expect(result).toEqual({ property: 'deletedBy', value: null });
        });
    });
});
