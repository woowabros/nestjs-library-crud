import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { SoftDeleteAndRecoverModule } from './soft-delete-and-recover.module';
import { BaseEntity } from '../base/base.entity';
import { TestHelper } from '../test.helper';

describe('Soft-delete and recover test', () => {
    let app: INestApplication;

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [SoftDeleteAndRecoverModule, TestHelper.getTypeOrmMysqlModule([BaseEntity])],
        }).compile();
        app = moduleFixture.createNestApplication();

        await app.init();
    });

    afterEach(async () => {
        await TestHelper.dropTypeOrmEntityTables();
        await app?.close();
    });

    const testCases = [
        ['soft-delete-and-get-soft-deleted', true, true],
        ['soft-delete-and-ignore-soft-deleted', true, false],
        ['delete-and-ignore-soft-deleted', false, false],
        ['delete-and-get-soft-deleted', false, true],
    ];

    test.each(testCases)('%p softDeleted %p getSoftDeleted %p with recover', async (url, softDeleted, getSoftDeleted) => {
        const name = url;
        const created = await request(app.getHttpServer()).post(`/${url}`).send({ name });
        expect(created.statusCode).toEqual(HttpStatus.CREATED);
        const id = created.body.id;

        await request(app.getHttpServer()).delete(`/${url}/${id}`).expect(HttpStatus.OK);

        const getResponse = await request(app.getHttpServer()).get(`/${url}/${id}`);
        const { body: getManyResponseBody } = await request(app.getHttpServer()).get(`/${url}`).expect(HttpStatus.OK);
        const recoverResponse = await request(app.getHttpServer()).post(`/${url}/${id}/recover`);

        if (softDeleted) {
            if (getSoftDeleted) {
                expect(url).toEqual('soft-delete-and-get-soft-deleted');
                expect(getResponse.statusCode).toEqual(HttpStatus.OK);
                expect(getResponse.body.name).toEqual(url);
                expect(getManyResponseBody.data).toHaveLength(1);
                expect(getManyResponseBody.data[0].name).toEqual(url);
            } else {
                expect(url).toEqual('soft-delete-and-ignore-soft-deleted');
                expect(getResponse.statusCode).toEqual(HttpStatus.BAD_REQUEST);
                expect(getManyResponseBody.data).toHaveLength(0);
            }
            expect(recoverResponse.status).toEqual(HttpStatus.CREATED);
            await request(app.getHttpServer()).delete(`/${url}/${id}`).expect(HttpStatus.OK);
        } else {
            if (getSoftDeleted) {
                expect(url).toEqual('delete-and-get-soft-deleted');
                expect(getResponse.statusCode).toEqual(HttpStatus.BAD_REQUEST);
                expect(getManyResponseBody.data).toHaveLength(0);
            } else {
                expect(url).toEqual('delete-and-ignore-soft-deleted');
                expect(getResponse.statusCode).toEqual(HttpStatus.BAD_REQUEST);
                expect(getManyResponseBody.data).toHaveLength(0);
            }
            expect(recoverResponse.status).toEqual(HttpStatus.NOT_FOUND);
            await request(app.getHttpServer()).delete(`/${url}/${id}`).expect(HttpStatus.BAD_REQUEST);
        }
    });
});
