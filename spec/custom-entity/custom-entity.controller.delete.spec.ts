import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { CustomEntity } from './custom-entity.entity';
import { CustomEntityModule } from './custom-entity.module';
import { CustomEntityService } from './custom-entity.service';
import { TestHelper } from '../test.helper';

describe('CustomEntity - Delete', () => {
    let app: INestApplication;
    let service: CustomEntityService;

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [CustomEntityModule, TestHelper.getTypeOrmMysqlModule([CustomEntity])],
        }).compile();
        app = moduleFixture.createNestApplication();

        service = moduleFixture.get<CustomEntityService>(CustomEntityService);
        await Promise.all(['name1', 'name2'].map((name: string) => service.repository.save(service.repository.create({ name }))));

        await app.init();
    });

    afterEach(async () => {
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
            const created = await request(app.getHttpServer()).post('/base').send({ name });
            expect(created.statusCode).toEqual(HttpStatus.CREATED);
            const uuid = created.body.uuid;

            await request(app.getHttpServer()).delete(`/base/${uuid}`).expect(HttpStatus.OK);

            await request(app.getHttpServer()).get(`/base/${uuid}`).expect(HttpStatus.BAD_REQUEST);

            await request(app.getHttpServer()).delete(`/base/${uuid}`).expect(HttpStatus.BAD_REQUEST);
        });
    });
});
