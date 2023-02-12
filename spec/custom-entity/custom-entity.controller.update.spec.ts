import { INestApplication, HttpStatus } from '@nestjs/common';
import { TestingModule, Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import request from 'supertest';

import { CustomEntity } from './custom-entity.entity';
import { CustomEntityModule } from './custom-entity.module';
import { CustomEntityService } from './custom-entity.service';

describe('CustomEntity - Update', () => {
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

    describe('UPDATE_ONE', () => {
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
            expect(routerPathList.patch).toEqual(expect.arrayContaining(['/base/:uuid']));
        });

        it('updates one entity', async () => {
            const oldName = 'name1';
            const created = await request(app.getHttpServer()).post('/base').send({ name: oldName }).expect(HttpStatus.CREATED);
            expect(created.body.name).toEqual(oldName);

            const newName = 'name2';
            await request(app.getHttpServer())
                .patch(`/base/${created.body.uuid}`)
                .send({ name: newName })
                .expect(HttpStatus.UNPROCESSABLE_ENTITY);

            await request(app.getHttpServer()).patch(`/base/${created.body.uuid}`).send({}).expect(HttpStatus.OK);

            const descriptions = 'descriptions';
            await request(app.getHttpServer()).patch(`/base/${created.body.uuid}`).send({ descriptions }).expect(HttpStatus.OK);

            const response = await request(app.getHttpServer()).get(`/base/${created.body.uuid}`).expect(HttpStatus.OK);
            expect(response.body.name).not.toEqual(newName);
            expect(response.body.descriptions).toEqual(descriptions);
        });
    });
});
