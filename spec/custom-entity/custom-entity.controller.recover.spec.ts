import { HttpStatus } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { CustomEntity } from './custom-entity.entity';
import { CustomEntityModule } from './custom-entity.module';
import { TestHelper } from '../test.helper';

import type { INestApplication } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';

describe('CustomEntity - Delete', () => {
    let app: INestApplication;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [CustomEntityModule, TestHelper.getTypeOrmMysqlModule([CustomEntity])],
        }).compile();
        app = moduleFixture.createNestApplication();

        await app.init();
    });

    afterAll(async () => {
        await TestHelper.dropTypeOrmEntityTables();
        await app?.close();
    });

    describe('RECOVER', () => {
        it('should be provided /:uuid/recover', async () => {
            const routerPathList = TestHelper.getRoutePath(app.getHttpServer());
            expect(routerPathList.post).toEqual(expect.arrayContaining(['/base/:uuid/recover']));
        });

        it('recover the entity after delete', async () => {
            const name = 'name1';
            const {
                body: { uuid },
            } = await request(app.getHttpServer()).post('/base').send({ name }).expect(HttpStatus.CREATED);

            await request(app.getHttpServer()).get(`/base/${uuid}`).expect(HttpStatus.OK);

            await request(app.getHttpServer()).delete(`/base/${uuid}`).expect(HttpStatus.OK);

            await request(app.getHttpServer()).get(`/base/${uuid}`).expect(HttpStatus.NOT_FOUND);

            const { body } = await request(app.getHttpServer()).get('/base').expect(HttpStatus.OK);
            expect(body.data.some((entity: any) => entity.uuid === uuid)).toBeFalsy();

            await request(app.getHttpServer()).post(`/base/${uuid}/recover`).expect(HttpStatus.CREATED);

            await request(app.getHttpServer()).get(`/base/${uuid}`).expect(HttpStatus.OK);
        });
    });
});
