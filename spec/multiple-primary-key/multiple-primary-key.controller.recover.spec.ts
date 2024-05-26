import { HttpStatus } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { MultiplePrimaryKeyEntity } from './multiple-primary-key.entity';
import { MultiplePrimaryKeyModule } from './multiple-primary-key.module';
import { MultiplePrimaryKeyService } from './multiple-primary-key.service';
import { TestHelper } from '../test.helper';

import type { INestApplication } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';

describe('MultiplePrimaryKey - Recover', () => {
    let app: INestApplication;
    let service: MultiplePrimaryKeyService;
    let entities: MultiplePrimaryKeyEntity[];

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [MultiplePrimaryKeyModule, TestHelper.getTypeOrmMysqlModule([MultiplePrimaryKeyEntity])],
        }).compile();
        app = moduleFixture.createNestApplication();

        service = moduleFixture.get<MultiplePrimaryKeyService>(MultiplePrimaryKeyService);
        entities = await Promise.all(
            ['name1', 'name2'].map((name: string) => service.repository.save(service.repository.create({ name }))),
        );

        await app.init();
    });

    afterAll(async () => {
        await TestHelper.dropTypeOrmEntityTables();
        await app?.close();
    });

    describe('RECOVER', () => {
        it('should be provided /:uuid1/:uuid2/recover', async () => {
            const routerPathList = TestHelper.getRoutePath(app.getHttpServer());
            expect(routerPathList.post).toEqual(expect.arrayContaining(['/base/:uuid1/:uuid2/recover']));
        });

        it('recover the entity after delete', async () => {
            const { uuid1, uuid2 } = entities[0];
            await request(app.getHttpServer()).get(`/base/${uuid1}/${uuid2}`).expect(HttpStatus.OK);

            await request(app.getHttpServer()).delete(`/base/${uuid1}/${uuid2}`).expect(HttpStatus.OK);

            await request(app.getHttpServer()).get(`/base/${uuid1}/${uuid2}`).expect(HttpStatus.NOT_FOUND);

            const { body } = await request(app.getHttpServer()).get('/base').expect(HttpStatus.OK);
            expect(body.data.some((entity: MultiplePrimaryKeyEntity) => entity.uuid1 === uuid1 && entity.uuid2 === uuid2)).toBeFalsy();

            await request(app.getHttpServer()).post(`/base/${uuid1}/${uuid2}/recover`).expect(HttpStatus.CREATED);

            await request(app.getHttpServer()).get(`/base/${uuid1}/${uuid2}`).expect(HttpStatus.OK);
        });
    });
});
