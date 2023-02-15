import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { BaseEntity } from './base.entity';
import { BaseModule } from './base.module';
import { TestHelper } from '../test.helper';

describe('BaseController', () => {
    let app: INestApplication;

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [BaseModule, TestHelper.getTypeOrmMysqlModule([BaseEntity])],
        }).compile();
        app = moduleFixture.createNestApplication();

        await app.init();
    });

    afterEach(async () => {
        await TestHelper.dropTypeOrmEntityTables();
        await app?.close();
    });

    describe('UPDATE', () => {
        it('should be provided /:id', async () => {
            const routerPathList = TestHelper.getRoutePath(app.getHttpServer());
            expect(routerPathList.patch).toEqual(expect.arrayContaining(['/base/:id']));
        });

        it('updates one entity', async () => {
            const oldName = 'name1';
            const created = await request(app.getHttpServer()).post('/base').send({ name: oldName });
            expect(created.statusCode).toEqual(HttpStatus.CREATED);
            const id = created.body.id;

            const newName = 'name2';
            await request(app.getHttpServer()).patch(`/base/${id}`).send({ name: newName }).expect(HttpStatus.OK);

            const response = await request(app.getHttpServer()).get(`/base/${id}`).expect(HttpStatus.OK);
            expect(response.body.name).toEqual(newName);
        });

        it('should throw when entity does not exist', async () => {
            await request(app.getHttpServer()).patch('/base/1').send({ name: 'name' }).expect(HttpStatus.BAD_REQUEST);
        });

        it('should be able to changed updatedAt', async () => {
            const oldName = 'name1';
            const created = await request(app.getHttpServer()).post('/base').send({ name: oldName });
            expect(created.statusCode).toEqual(HttpStatus.CREATED);
            const id = created.body.id;

            await new Promise((res) => setTimeout(res, 1000));
            await request(app.getHttpServer()).patch(`/base/${id}`).send({ name: 'name2' }).expect(HttpStatus.OK);

            const readOne = await request(app.getHttpServer()).get(`/base/${id}`).expect(HttpStatus.OK);

            expect(created.body.lastModifiedAt).not.toEqual(readOne.body.lastModifiedAt);
            expect(created.body.createdAt).toEqual(readOne.body.createdAt);
        });

        it('update value of primary key', async () => {
            const name = 'name1';
            const created = await request(app.getHttpServer()).post('/base').send({ name });
            expect(created.statusCode).toEqual(HttpStatus.CREATED);
            const id = created.body.id;

            const newId = 2;
            await request(app.getHttpServer()).patch(`/base/${id}`).send({ id: newId }).expect(HttpStatus.UNPROCESSABLE_ENTITY);
        });

        it('update value of unknown key', async () => {
            const name = 'name1';
            const created = await request(app.getHttpServer()).post('/base').send({ name });
            expect(created.statusCode).toEqual(HttpStatus.CREATED);
            const id = created.body.id;
            await request(app.getHttpServer()).patch(`/base/${id}`).send({ position: 3 }).expect(HttpStatus.UNPROCESSABLE_ENTITY);
        });

        it('update value of mismatch type', async () => {
            const name = 'name1';
            const created = await request(app.getHttpServer()).post('/base').send({ name });
            expect(created.statusCode).toEqual(HttpStatus.CREATED);
            const id = created.body.id;
            await request(app.getHttpServer()).patch(`/base/${id}`).send({ name: true }).expect(HttpStatus.UNPROCESSABLE_ENTITY);
        });

        it('should be checked params type', async () => {
            await request(app.getHttpServer())
                .patch(`/base/${Number('a')}`)
                .expect(HttpStatus.NOT_FOUND);
        });
    });
});
