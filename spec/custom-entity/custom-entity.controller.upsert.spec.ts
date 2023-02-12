import { INestApplication, HttpStatus } from '@nestjs/common';
import { TestingModule, Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import request from 'supertest';

import { CustomEntity } from './custom-entity.entity';
import { CustomEntityModule } from './custom-entity.module';
import { CustomEntityService } from './custom-entity.service';

describe('CustomEntity - Upsert', () => {
    let app: INestApplication;
    let service: CustomEntityService;

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [
                CustomEntityModule,
                TypeOrmModule.forRoot({
                    type: 'sqlite',
                    database: ':memory:',
                    entities: [CustomEntity],
                    synchronize: true,
                    logging: true,
                    logger: 'file',
                }),
            ],
        }).compile();
        app = moduleFixture.createNestApplication();

        service = moduleFixture.get<CustomEntityService>(CustomEntityService);
        await Promise.all(['name1', 'name2'].map((name: string) => service.repository.save(service.repository.create({ name }))));

        await app.init();
    });

    afterAll(async () => {
        if (app) {
            await app.close();
        }
    });

    describe('UPSERT', () => {
        it('should be provided /:uuid', async () => {
            const routerPathList = app.getHttpServer()._events.request._router.stack.reduce((list: Record<string, string[]>, r) => {
                if (r.route?.path) {
                    for (const method of Object.keys(r.route.methods)) {
                        list[method] = list[method] ?? [];
                        list[method].push(r.route.path);
                    }
                }
                return list;
            }, {});
            expect(routerPathList.put).toEqual(expect.arrayContaining(['/base/:uuid']));
        });

        it('should update entity if exists', async () => {
            const oldName = 'name1';
            const created = await request(app.getHttpServer()).post('/base').send({ name: oldName }).expect(HttpStatus.CREATED);
            expect(created.body.name).toEqual(oldName);

            const newName = 'name2';
            await request(app.getHttpServer()).put(`/base/${created.body.uuid}`).send({ name: newName }).expect(HttpStatus.OK);
            await request(app.getHttpServer()).put(`/base/${created.body.uuid}`).send({}).expect(HttpStatus.OK);

            const descriptions = 'descriptions';
            await request(app.getHttpServer()).put(`/base/${created.body.uuid}`).send({ descriptions }).expect(HttpStatus.OK);

            const response = await request(app.getHttpServer()).get(`/base/${created.body.uuid}`).expect(HttpStatus.OK);
            expect(response.body.name).toEqual(newName);
            expect(response.body.descriptions).toEqual(descriptions);
        });

        it('should create entity if not exists', async () => {
            const name = 'name1';
            const uuid = '0x1234';

            await request(app.getHttpServer()).get(`/base/${uuid}`).expect(HttpStatus.NOT_FOUND);
            await request(app.getHttpServer()).put(`/base/${uuid}`).send({ name }).expect(HttpStatus.OK);

            const responseWithoutDescription = await request(app.getHttpServer()).get(`/base/${uuid}`).expect(HttpStatus.OK);
            expect(responseWithoutDescription.body.descriptions).toBeNull();

            await request(app.getHttpServer()).put(`/base/${uuid}`).send({}).expect(HttpStatus.OK);
            await request(app.getHttpServer()).put(`/base/${uuid}`).send({ nonamed: 'test' }).expect(HttpStatus.UNPROCESSABLE_ENTITY);

            const descriptions = 'descriptions';
            await request(app.getHttpServer()).put(`/base/${uuid}`).send({ descriptions }).expect(HttpStatus.OK);

            const response = await request(app.getHttpServer()).get(`/base/${uuid}`).expect(HttpStatus.OK);
            expect(response.body.name).toEqual(name);
            expect(response.body.descriptions).toEqual(descriptions);
        });
    });
});
