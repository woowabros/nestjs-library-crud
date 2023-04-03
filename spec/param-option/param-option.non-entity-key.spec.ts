import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import _ from 'lodash';
import request from 'supertest';

import { DynamicCrudModule } from '../dynamic-crud.module';
import { TestHelper } from '../test.helper';

describe('Params Option - used as params instead of key of entity', () => {
    let app: INestApplication;
    const param = 'unknownProperty';

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [
                DynamicCrudModule({
                    readOne: { params: [param] },
                    delete: { params: [param] },
                    recover: { params: [param] },
                    upsert: { params: [param] },
                    update: { params: [param] },
                }),
            ],
        }).compile();
        app = moduleFixture.createNestApplication();
        await app.init();
    });

    afterEach(async () => {
        await TestHelper.dropTypeOrmEntityTables();
        await app?.close();
    });

    it(`should be provided /base/:${param}`, () => {
        const routerPathList = TestHelper.getRoutePath(app.getHttpServer());

        expect(routerPathList.get).toEqual(expect.arrayContaining([`/base/:${param}`])); // readOne
        expect(routerPathList.delete).toEqual(expect.arrayContaining([`/base/:${param}`])); // delete
        expect(routerPathList.post).toEqual(expect.arrayContaining([`/base/:${param}/recover`])); // recover
        expect(routerPathList.patch).toEqual(expect.arrayContaining([`/base/:${param}`])); //updateOne
        expect(routerPathList.put).toEqual(expect.arrayContaining([`/base/:${param}`])); // upsert
    });

    it(`should read and update entity by ${param}`, async () => {
        const names = ['name1', 'name1', 'name2', 'name2', 'name3', 'name1'];

        await Promise.all(
            _.range(0, names.length).map((index) =>
                request(app.getHttpServer()).post('/base').send({ name: names[index] }).expect(HttpStatus.CREATED),
            ),
        );

        const readManyResponse = await request(app.getHttpServer()).get('/base').expect(HttpStatus.OK);
        expect(readManyResponse.body.data).toHaveLength(names.length);

        const readManyResponseFilteredByName = await request(app.getHttpServer())
            .get('/base')
            .query({ name: 'name1' })
            .expect(HttpStatus.OK);
        expect(readManyResponseFilteredByName.body.data).toHaveLength(3);

        const id = readManyResponseFilteredByName.body.data[0].id;
        await request(app.getHttpServer()).get(`/base/${id}`).expect(HttpStatus.NOT_FOUND);
        await request(app.getHttpServer()).get('/base/name1').expect(HttpStatus.NOT_FOUND);

        await request(app.getHttpServer()).patch(`/base/${id}`).send({ name: 'nonamed' }).expect(HttpStatus.NOT_FOUND);
        await request(app.getHttpServer()).patch('/base/name1').send({ name: 'nonamed' }).expect(HttpStatus.NOT_FOUND);

        await request(app.getHttpServer()).post(`/base/${id}/recover`).send({ name: 'nonamed' }).expect(HttpStatus.NOT_FOUND);
        await request(app.getHttpServer()).post('/base/name1/recover').send({ name: 'nonamed' }).expect(HttpStatus.NOT_FOUND);

        await request(app.getHttpServer()).delete(`/base/${id}`).expect(HttpStatus.NOT_FOUND);
        await request(app.getHttpServer()).delete('/base/name1').expect(HttpStatus.NOT_FOUND);
    });
});
