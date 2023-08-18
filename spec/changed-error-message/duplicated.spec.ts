import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { TestEntity, TestModule } from './test.module';
import { TestHelper } from '../test.helper';

describe('Changed Error message', () => {
    let app: INestApplication;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [TestModule, TestHelper.getTypeOrmPgsqlModule([TestEntity])],
        }).compile();
        app = moduleFixture.createNestApplication();
        await app.init();
    });

    afterAll(async () => {
        await TestHelper.dropTypeOrmEntityTables();
        await app?.close();
    });

    it('should be returned defined error message when duplicated', async () => {
        await request(app.getHttpServer()).post('/base').send({ uuid: 'uuid', name: 'name' }).expect(HttpStatus.CREATED);
        const { body } = await request(app.getHttpServer()).post('/base').send({ uuid: 'uuid2', name: 'name' }).expect(HttpStatus.CONFLICT);
        expect(body).toEqual({ statusCode: 409, message: 'custom error message' });
    });
});
