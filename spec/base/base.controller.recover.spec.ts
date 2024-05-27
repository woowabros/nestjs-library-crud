import { HttpStatus } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { BaseEntity } from './base.entity';
import { BaseModule } from './base.module';
import { TestHelper } from '../test.helper';

import type { INestApplication } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';

describe('BaseController', () => {
    let app: INestApplication;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [BaseModule, TestHelper.getTypeOrmMysqlModule([BaseEntity])],
        }).compile();
        app = moduleFixture.createNestApplication();

        await app.init();
    });

    afterAll(async () => {
        await TestHelper.dropTypeOrmEntityTables();
        await app?.close();
    });

    describe('RECOVER', () => {
        it('should be provided /:id/recover', async () => {
            const routerPathList = TestHelper.getRoutePath(app.getHttpServer());
            expect(routerPathList.post).toEqual(expect.arrayContaining(['/base/:id/recover']));
        });

        it('recover the entity after delete', async () => {
            const name = 'name1';
            const created = await request(app.getHttpServer()).post('/base').send({ name }).expect(HttpStatus.CREATED);
            const id = created.body.id;

            await request(app.getHttpServer()).get(`/base/${id}`).expect(HttpStatus.OK);

            await request(app.getHttpServer()).delete(`/base/${id}`).expect(HttpStatus.OK);

            await request(app.getHttpServer()).get(`/base/${id}`).expect(HttpStatus.NOT_FOUND);

            const { body } = await request(app.getHttpServer()).get('/base').expect(HttpStatus.OK);
            expect(body.data.some((entity: any) => entity.id === id)).toBeFalsy();

            const recoverResponse = await request(app.getHttpServer()).post(`/base/${id}/recover`).expect(HttpStatus.CREATED);
            expect(recoverResponse.body.deletedAt).toBeNull();

            const getResponse = await request(app.getHttpServer()).get(`/base/${id}`).expect(HttpStatus.OK);
            expect(getResponse.body.deletedAt).toBeNull();
        });

        it('should be checked params type', async () => {
            await request(app.getHttpServer())
                .post(`/base/${Number('a')}/recover`)
                .expect(HttpStatus.NOT_FOUND);
        });

        it('should be throw not found exception', async () => {
            await request(app.getHttpServer()).post('/base/0/recover').expect(HttpStatus.NOT_FOUND);
        });
    });
});
