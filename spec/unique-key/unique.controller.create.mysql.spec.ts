import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { UniqueEntity } from './unique.entity';
import { UniqueModule } from './unique.module';
import { TestHelper } from '../test.helper';

describe('UniqueController', () => {
    let app: INestApplication;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [UniqueModule, TestHelper.getTypeOrmMysqlModule([UniqueEntity])],
        }).compile();
        app = moduleFixture.createNestApplication();

        await app.init();
    });

    afterAll(async () => {
        await TestHelper.dropTypeOrmEntityTables();
        await app?.close();
    });

    describe('CREATE_ONE', () => {
        it('should throw when cannot create duplicated entities', async () => {
            const name = 'name1';
            await request(app.getHttpServer()).post('/unique').send({ name }).expect(HttpStatus.CREATED);
            await request(app.getHttpServer()).post('/unique').send({ name }).expect(HttpStatus.CONFLICT);
            await request(app.getHttpServer()).post('/unique').send({ name: 'name2' }).expect(HttpStatus.CREATED);
        });
    });

    describe('CREATE_MANY', () => {
        it('should throw when cannot create every entities', async () => {
            const toCreate = [{ name: 'name1' }, { name: 'name2' }, { name: 'name1' }, { name: 'name3' }];
            await request(app.getHttpServer()).post('/unique').send(toCreate).expect(HttpStatus.CONFLICT);
        });
    });

    describe('UPDATE', () => {
        it('should throw when cannot update duplicated entities', async () => {
            const name = `name-${Date.now()}`;
            await request(app.getHttpServer()).post('/unique').send({ name }).expect(HttpStatus.CREATED);
            const { body: created } = await request(app.getHttpServer())
                .post('/unique')
                .send({ name: name + '2' })
                .expect(HttpStatus.CREATED);
            await request(app.getHttpServer()).patch(`/unique/${created.id}`).send({ name }).expect(HttpStatus.CONFLICT);
            await request(app.getHttpServer())
                .patch(`/unique/${created.id}`)
                .send({ name: name + '3' })
                .expect(HttpStatus.OK);
        });
    });
});
