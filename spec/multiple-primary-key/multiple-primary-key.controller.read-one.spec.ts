import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { MultiplePrimaryKeyEntity } from './multiple-primary-key.entity';
import { MultiplePrimaryKeyModule } from './multiple-primary-key.module';
import { MultiplePrimaryKeyService } from './multiple-primary-key.service';
import { TestHelper } from '../test.helper';

describe('MultiplePrimaryKey - ReadOne', () => {
    let app: INestApplication;
    let service: MultiplePrimaryKeyService;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [MultiplePrimaryKeyModule, TestHelper.getTypeOrmMysqlModule([MultiplePrimaryKeyEntity])],
        }).compile();
        app = moduleFixture.createNestApplication();

        service = moduleFixture.get<MultiplePrimaryKeyService>(MultiplePrimaryKeyService);
        await service.repository.save(['name1', 'name2'].map((name: string) => service.repository.create({ name })));

        await app.init();
    });

    afterAll(async () => {
        await TestHelper.dropTypeOrmEntityTables();
        await app?.close();
    });

    describe('READ_ONE', () => {
        let entity: MultiplePrimaryKeyEntity;
        beforeAll(async () => {
            entity = (await service.getAll())?.[0];
        });

        it('should be provided /:uuid1/:uuid2', async () => {
            const routerPathList = TestHelper.getRoutePath(app.getHttpServer());
            expect(routerPathList.get).toEqual(expect.arrayContaining(['/base/:uuid1/:uuid2']));
        });

        it('should be returned only one entity', async () => {
            const response = await request(app.getHttpServer())
                .get(`/base/${entity.uuid1}/${entity.uuid2}`)
                .query({ fields: ['uuid1', 'uuid2', 'name'] });

            expect(response.statusCode).toEqual(HttpStatus.OK);
            expect(response.body.uuid1).toEqual(entity.uuid1);
            expect(response.body.uuid2).toEqual(entity.uuid2);
            expect(response.body.name).toEqual(expect.any(String));
            expect(response.body.lastModifiedAt).toBeUndefined();
        });

        it('should be use only column names in field options', async () => {
            await request(app.getHttpServer())
                .get(`/base/${entity.uuid1}/${entity.uuid2}`)
                .query({ fields: ['uuid1', 'name'] })
                .expect(HttpStatus.OK);

            await request(app.getHttpServer())
                .get(`/base/${entity.uuid1}/${entity.uuid2}`)
                .query({ fields: ['uuid1', 'name', 'createdAt', true] })
                .expect(HttpStatus.UNPROCESSABLE_ENTITY);

            await request(app.getHttpServer())
                .get(`/base/${entity.uuid1}/${entity.uuid2}`)
                .query({ fields: ['uuid', 'name'] })
                .expect(HttpStatus.UNPROCESSABLE_ENTITY);
        });
    });
});
