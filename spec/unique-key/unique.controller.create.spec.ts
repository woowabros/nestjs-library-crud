import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { UniqueEntity } from './unique.entity';
import { UniqueModule } from './unique.module';
import { TestHelper } from '../test.helper';

describe('UniqueController', () => {
    let app: INestApplication;

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [UniqueModule, TestHelper.getTypeOrmMysqlModule([UniqueEntity])],
        }).compile();
        app = moduleFixture.createNestApplication();

        await app.init();
    });

    afterEach(async () => {
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
});
