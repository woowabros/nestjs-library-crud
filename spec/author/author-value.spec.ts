import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { TestEntity, TestModule } from './author-value.module';
import { TestHelper } from '../test.helper';

describe('Author', () => {
    let app: INestApplication;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [TestModule, TestHelper.getTypeOrmMysqlModule([TestEntity])],
        }).compile();
        app = moduleFixture.createNestApplication();
        await app.init();
    });

    afterAll(async () => {
        await TestHelper.dropTypeOrmEntityTables();
        await app?.close();
    });

    it('should be set to value, if filter is empty', async () => {
        const { body: createdBody } = await request(app.getHttpServer())
            .post('/base')
            .send({ col1: '1', col2: 1, col3: 10 })
            .expect(HttpStatus.CREATED);
        expect(createdBody.col2).toEqual(1);
        expect(createdBody.col3).toEqual(10);
        expect(createdBody.createdBy).toEqual('fixed value');
        expect(createdBody.createdAt).toBeDefined();
        expect(createdBody.updatedBy).toBeNull();
        expect(createdBody.lastModifiedAt).toBeDefined();
        expect(createdBody.deletedBy).toBeNull();
        expect(createdBody.deletedAt).toBeNull();
    });

    it('should be set to value, if the value obtained by filter is empty', async () => {
        const { body: upsertBody } = await request(app.getHttpServer()).put('/base/2').send({ col2: 2, col3: 20 }).expect(HttpStatus.OK);
        expect(upsertBody.col2).toEqual(2);
        expect(upsertBody.createdBy).toBeNull();
        expect(upsertBody.createdAt).toBeDefined();
        expect(upsertBody.updatedBy).toEqual('Request User');
        expect(upsertBody.lastModifiedAt).toBeDefined();
        expect(upsertBody.deletedBy).toBeNull();
        expect(upsertBody.deletedAt).toBeNull();

        const { body: updatedBody } = await request(app.getHttpServer()).patch('/base/2').send({ col3: 15 }).expect(HttpStatus.OK);
        expect(updatedBody.col2).toEqual(2);
        expect(updatedBody.col3).toEqual(15);
        expect(updatedBody.createdBy).toEqual(upsertBody.createdBy);
        expect(updatedBody.createdAt).toEqual(upsertBody.createdAt);
        expect(updatedBody.updatedBy).toEqual('default value');
        expect(updatedBody.lastModifiedAt).not.toEqual(upsertBody.lastModifiedAt);
        expect(updatedBody.deletedBy).toBeNull();
        expect(updatedBody.deletedAt).toBeNull();
    });
});
