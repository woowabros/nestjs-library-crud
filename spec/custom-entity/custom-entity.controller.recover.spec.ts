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
    let entities: CustomEntity[];

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [CustomEntityModule, TestHelper.getTypeOrmMysqlModule([CustomEntity])],
        }).compile();
        app = moduleFixture.createNestApplication();

        service = moduleFixture.get<CustomEntityService>(CustomEntityService);
        entities = await Promise.all(
            ['name1', 'name2'].map((name: string) => service.repository.save(service.repository.create({ name }))),
        );

        await app.init();
    });

    afterEach(async () => {
        await TestHelper.dropTypeOrmEntityTables();
        await app?.close();
    });

    describe('RECOVER', () => {
        it('should be provided /:uuid/recover', async () => {
            const routerPathList = TestHelper.getRoutePath(app.getHttpServer());
            expect(routerPathList.post).toEqual(expect.arrayContaining(['/base/:uuid/recover']));
        });

        it('recover the entity after delete', async () => {
            const uuid = entities[0].uuid;
            await request(app.getHttpServer()).get(`/base/${uuid}`).expect(HttpStatus.OK);

            // Delete
            await request(app.getHttpServer()).delete(`/base/${uuid}`).expect(HttpStatus.OK);

            // getOne -> NotFOUND
            await request(app.getHttpServer()).get(`/base/${uuid}`).expect(HttpStatus.BAD_REQUEST);

            // getMany -> id가 없다.
            const { body } = await request(app.getHttpServer()).get('/base').expect(HttpStatus.OK);
            expect(body.data.some((entity: any) => entity.uuid === uuid)).toBeFalsy();

            // Recover
            await request(app.getHttpServer()).post(`/base/${uuid}/recover`).expect(HttpStatus.CREATED);

            // GetOne -> OK
            await request(app.getHttpServer()).get(`/base/${uuid}`).expect(HttpStatus.OK);
        });
    });
});
