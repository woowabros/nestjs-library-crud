import { HttpStatus, INestApplication } from '@nestjs/common';
import { TestingModule, Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import request from 'supertest';

import { SwaggerDecoratorModule } from './swagger-decorator.module';
import { BaseEntity } from '../base/base.entity';

describe('SwaggerDecorator', () => {
    let app: INestApplication;

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [
                SwaggerDecoratorModule,
                TypeOrmModule.forRoot({
                    type: 'sqlite',
                    database: ':memory:',
                    entities: [BaseEntity],
                    synchronize: true,
                    logging: true,
                    logger: 'file',
                }),
            ],
        }).compile();

        app = moduleFixture.createNestApplication();

        await app.init();
    });

    afterAll(async () => {
        if (app) {
            await app.close();
        }
    });

    it('should be added swagger decorator', async () => {
        const routerPathList = app
            .getHttpServer()
            ._events.request._router.stack.reduce(
                (list: Record<string, string[]>, r: { route: { path: string; methods: { methods: unknown } } }) => {
                    if (r.route?.path) {
                        for (const method of Object.keys(r.route.methods)) {
                            list[method] = list[method] ?? [];
                            list[method].push(r.route.path);
                        }
                    }
                    return list;
                },
                {},
            );
        expect(routerPathList.get).toEqual(expect.arrayContaining(['/swagger-decorator/:key/:id', '/swagger-decorator/:key']));

        const response = await request(app.getHttpServer()).post('/swagger-decorator/123').send({ name: 'name' });
        expect(response.status).toEqual(HttpStatus.CREATED);
        expect(response.body.name).toEqual('name');

        await request(app.getHttpServer()).get('/swagger-decorator/456').expect(HttpStatus.OK);

        const readOneResponse = await request(app.getHttpServer()).get(`/swagger-decorator/456/${response.body.id}`);
        expect(readOneResponse.status).toEqual(HttpStatus.OK);
        expect(readOneResponse.body.name).toEqual('name');
    });
});
