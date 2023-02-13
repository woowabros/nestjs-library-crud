import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import request from 'supertest';

import { MultiplePrimaryKeyEntity } from './multiple-primary-key.entity';
import { MultiplePrimaryKeyModule } from './multiple-primary-key.module';
import { MultiplePrimaryKeyService } from './multiple-primary-key.service';
import { TestHelper } from '../test.helper';

describe('MultiplePrimaryKey - Delete', () => {
    let app: INestApplication;
    let service: MultiplePrimaryKeyService;

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [
                MultiplePrimaryKeyModule,
                TypeOrmModule.forRoot({
                    type: 'sqlite',
                    database: ':memory:',
                    entities: [MultiplePrimaryKeyEntity],
                    synchronize: true,
                    logging: true,
                    logger: 'file',
                }),
            ],
        }).compile();
        app = moduleFixture.createNestApplication();

        service = moduleFixture.get<MultiplePrimaryKeyService>(MultiplePrimaryKeyService);
        await Promise.all(['name1', 'name2'].map((name: string) => service.repository.save(service.repository.create({ name }))));

        await app.init();
    });

    afterAll(async () => {
        if (app) {
            await app.close();
        }
    });

    describe('DELETE', () => {
        it('should be provided /:uuid1/:uuid2', async () => {
            const routerPathList = TestHelper.getRoutePath(app.getHttpServer());
            expect(routerPathList.delete).toEqual(expect.arrayContaining(['/base/:uuid1/:uuid2']));
        });

        it('removes one entity', async () => {
            const name = 'name1';
            const created = await request(app.getHttpServer()).post('/base').send({ name });
            expect(created.statusCode).toEqual(HttpStatus.CREATED);
            const uuid1 = created.body.uuid1;
            const uuid2 = created.body.uuid2;

            await request(app.getHttpServer()).delete(`/base/${uuid1}/${uuid2}`).expect(HttpStatus.OK);

            await request(app.getHttpServer()).get(`/base/${uuid1}/${uuid2}`).expect(HttpStatus.NOT_FOUND);

            await request(app.getHttpServer()).delete(`/base/${uuid1}/${uuid2}`).expect(HttpStatus.NOT_FOUND);
        });
    });
});
