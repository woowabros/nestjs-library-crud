import { HttpStatus } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { DynamicCrudModule } from '../dynamic-crud.module';
import { TestHelper } from '../test.helper';

import type { INestApplication } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';

describe('Params Option - When using the entity`s key as params', () => {
    let app: INestApplication;
    const param = 'name';

    beforeAll(async () => {
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

    afterAll(async () => {
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
            Array.from({ length: names.length }, (_, index) => index).map((index) =>
                request(app.getHttpServer()).post('/base').send({ name: names[index] }).expect(HttpStatus.CREATED),
            ),
        );

        const { body: readManyResponse } = await request(app.getHttpServer()).get('/base').expect(HttpStatus.OK);
        expect(readManyResponse.data).toHaveLength(names.length);

        const { body: readManyResponseFilteredByName } = await request(app.getHttpServer())
            .get('/base')
            .query({ name: 'name1' })
            .expect(HttpStatus.OK);
        expect(readManyResponseFilteredByName.data).toHaveLength(3);

        const { body: readOneResponse } = await request(app.getHttpServer()).get('/base/name1').expect(HttpStatus.OK);
        expect(readOneResponse.name).toEqual('name1');

        await request(app.getHttpServer()).patch('/base/name1').send({ name: 'noname' }).expect(HttpStatus.OK);

        const { body: readOneNonameResponse } = await request(app.getHttpServer()).get('/base/noname').expect(HttpStatus.OK);
        expect(readOneNonameResponse.name).toEqual('noname');

        const { body: readManyResponseAfterChange } = await request(app.getHttpServer())
            .get('/base')
            .query({ name: 'name1' })
            .expect(HttpStatus.OK);
        expect(readManyResponseAfterChange.data).toHaveLength(2);

        await request(app.getHttpServer()).delete('/base/name1').expect(HttpStatus.OK);

        const { body: readManyResponseAfterDelete } = await request(app.getHttpServer())
            .get('/base')
            .query({ name: 'name1' })
            .expect(HttpStatus.OK);
        expect(readManyResponseAfterDelete.data).toHaveLength(1);

        await request(app.getHttpServer()).post('/base/name1/recover').expect(HttpStatus.CREATED);

        const { body: readManyResponseAfterRecover } = await request(app.getHttpServer())
            .get('/base')
            .query({ name: 'name1' })
            .expect(HttpStatus.OK);
        expect(readManyResponseAfterRecover.data).toHaveLength(2);

        await request(app.getHttpServer()).put('/base/name3').send({ type: 3 }).expect(HttpStatus.OK);
        const { body: readOneResponseAfterUpsert } = await request(app.getHttpServer()).get('/base/name3').expect(HttpStatus.OK);
        expect(readOneResponseAfterUpsert.name).toEqual('name3');
        expect(readOneResponseAfterUpsert.type).toEqual(3);

        await request(app.getHttpServer()).put('/base/newName').send({ name: 'newName' }).expect(HttpStatus.OK);

        const { body: readManyResponseAfterUpsert } = await request(app.getHttpServer())
            .get('/base')
            .query({ name: 'newName' })
            .expect(HttpStatus.OK);
        expect(readManyResponseAfterUpsert.data).toHaveLength(1);
    });
});
