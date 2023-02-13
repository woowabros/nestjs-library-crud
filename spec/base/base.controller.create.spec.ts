import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { BaseEntity } from './base.entity';
import { BaseModule } from './base.module';
import { BaseService } from './base.service';
import { TestHelper } from '../test.helper';

describe('BaseController', () => {
    let app: INestApplication;
    let service: BaseService;

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [BaseModule, TestHelper.getTypeOrmMysqlModule([BaseEntity])],
        }).compile();
        app = moduleFixture.createNestApplication();

        service = moduleFixture.get<BaseService>(BaseService);
        await Promise.all(['name1', 'name2'].map((name: string) => service.repository.save(service.repository.create({ name }))));

        await app.init();
    });

    afterEach(async () => {
        await TestHelper.dropTypeOrmEntityTables();
        await app?.close();
    });

    describe('CREATE_ONE', () => {
        it('should be provided /', async () => {
            const routerPathList = TestHelper.getRoutePath(app.getHttpServer());
            expect(routerPathList.post).toEqual(expect.arrayContaining(['/base']));
        });

        it('creates one entity and returns it', async () => {
            const name = 'name1';
            const response = await request(app.getHttpServer()).post('/base').send({ name });

            expect(response.statusCode).toEqual(HttpStatus.CREATED);
            expect(response.body.name).toEqual(name);

            await request(app.getHttpServer()).get(`/base/${response.body.id}`).expect(HttpStatus.OK);
        });

        it('create value of unknown key', async () => {
            const name = 'name1';
            await request(app.getHttpServer()).post('/base').send({ name, nonamed: 1 }).expect(HttpStatus.UNPROCESSABLE_ENTITY);
        });
    });

    describe('CREATE_MANY', () => {
        it('creates many entities and returns all', async () => {
            const toCreate = [{ name: 'name1' }, { name: 'name2' }];

            const response = await request(app.getHttpServer()).post('/base').send(toCreate);

            expect(response.statusCode).toEqual(HttpStatus.CREATED);
            expect(response.body).toHaveLength(toCreate.length);

            await request(app.getHttpServer()).get(`/base/${response.body[0].id}`).expect(HttpStatus.OK);
        });

        it('create value of unknown key', async () => {
            const toCreate = [{ name: 'name1' }, { name: 'name2', nonamed: 2 }];
            await request(app.getHttpServer()).post('/base').send(toCreate).expect(HttpStatus.UNPROCESSABLE_ENTITY);
        });
    });
});
