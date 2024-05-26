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

    describe('DELETE', () => {
        it('should be provided /:uuid', async () => {
            const routerPathList = TestHelper.getRoutePath(app.getHttpServer());
            expect(routerPathList.delete).toEqual(expect.arrayContaining(['/base/:uuid']));
        });

        it('removes one entity', async () => {
            const name = 'name1';
            const {
                body: { uuid },
            } = await request(app.getHttpServer()).post('/base').send({ name }).expect(HttpStatus.CREATED);

            await request(app.getHttpServer()).delete(`/base/${uuid}`).expect(HttpStatus.OK);

            await request(app.getHttpServer()).get(`/base/${uuid}`).expect(HttpStatus.NOT_FOUND);

            await request(app.getHttpServer()).delete(`/base/${uuid}`).expect(HttpStatus.NOT_FOUND);
        });
    });
});
