import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import _ from 'lodash';
import request from 'supertest';

import { ParamsInterceptor } from './params.interceptor';
import { DynamicCrudModule } from '../dynamic-crud.module';
import { TestHelper } from '../test.helper';

describe('Params Option - changing params to Interceptor', () => {
    let app: INestApplication;
    const param = 'custom';

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [
                DynamicCrudModule({
                    readOne: { params: [param], interceptors: [ParamsInterceptor] },
                    delete: { params: [param], interceptors: [ParamsInterceptor] },
                    recover: { params: [param], interceptors: [ParamsInterceptor] },
                    upsert: { params: [param], interceptors: [ParamsInterceptor] },
                    update: { params: [param], interceptors: [ParamsInterceptor] },
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

        const readOneResponse = await request(app.getHttpServer()).get('/base/name1').expect(HttpStatus.OK);
        expect(readOneResponse.body.name).toEqual('name1');

        await request(app.getHttpServer()).patch('/base/name1').send({ name: 'noname' }).expect(HttpStatus.OK);

        const readOneNonameResponse = await request(app.getHttpServer()).get('/base/noname').expect(HttpStatus.OK);
        expect(readOneNonameResponse.body.name).toEqual('noname');

        const readManyResponseAfterChange = await request(app.getHttpServer()).get('/base').query({ name: 'name1' }).expect(HttpStatus.OK);
        expect(readManyResponseAfterChange.body.data).toHaveLength(2);

        await request(app.getHttpServer()).delete('/base/name1').expect(HttpStatus.OK);

        const readManyResponseAfterDelete = await request(app.getHttpServer()).get('/base').query({ name: 'name1' }).expect(HttpStatus.OK);
        expect(readManyResponseAfterDelete.body.data).toHaveLength(1);

        await request(app.getHttpServer()).post('/base/name1/recover').expect(HttpStatus.CREATED);

        const readManyResponseAfterRecover = await request(app.getHttpServer()).get('/base').query({ name: 'name1' }).expect(HttpStatus.OK);
        expect(readManyResponseAfterRecover.body.data).toHaveLength(2);

        await request(app.getHttpServer()).put('/base/newName').send({ type: 3 }).expect(HttpStatus.OK);
        const { body: readOneResponseAfterUpsert } = await request(app.getHttpServer()).get('/base/newName').expect(HttpStatus.OK);
        expect(readOneResponseAfterUpsert.name).toEqual('newName');
        expect(readOneResponseAfterUpsert.type).toEqual(3);

        const { body: updateAfterUpsert } = await request(app.getHttpServer()).put('/base/newName').send({ type: 5 }).expect(HttpStatus.OK);
        expect(updateAfterUpsert.name).toEqual('newName');
        expect(updateAfterUpsert.type).toEqual(5);

        const readManyResponseAfterUpsert = await request(app.getHttpServer())
            .get('/base')
            .query({ name: 'newName' })
            .expect(HttpStatus.OK);
        expect(readManyResponseAfterUpsert.body.data).toHaveLength(1);
    });
});
