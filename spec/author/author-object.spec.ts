import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { Author, TestEntity, TestModule } from './author-object.module';
import { TestHelper } from '../test.helper';

describe('Author - object', () => {
    let app: INestApplication;

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [TestModule, TestHelper.getTypeOrmPgsqlModule([TestEntity])],
        }).compile();
        app = moduleFixture.createNestApplication();
        await app.init();
    });

    afterEach(async () => {
        await TestHelper.dropTypeOrmEntityTables();
        await app?.close();
    });

    it('should be recorded the author for each action', async () => {
        const author: Author = {
            id: 'ID-1234',
            name: 'name',
            department: 'Request Department',
            modifiedAt: new Date(),
        };
        const { body: createdBody } = await request(app.getHttpServer())
            .post('/base')
            .send({ col1: '1', col2: 1, col3: 10 })
            .expect(HttpStatus.CREATED);
        expect(createdBody.col2).toEqual(1);
        expect(createdBody.col3).toEqual(10);
        expect(createdBody.createdBy.id).toEqual(author.id);
        expect(createdBody.updatedBy).toBeNull();
        expect(createdBody.deletedBy).toBeNull();
        expect(createdBody.deletedAt).toBeNull();

        const { body: updatedBody } = await request(app.getHttpServer()).patch('/base/1').send({ col3: 15 }).expect(HttpStatus.OK);
        expect(updatedBody.col2).toEqual(1);
        expect(updatedBody.col3).toEqual(15);
        expect(updatedBody.createdBy.id).toEqual(author.id);
        expect(updatedBody.createdBy.modifiedAt).toEqual(createdBody.createdBy.modifiedAt);
        expect(updatedBody.updatedBy.id).toEqual(author.id);
        expect(updatedBody.deletedBy).toBeNull();
        expect(updatedBody.deletedAt).toBeNull();

        const { body: deletedBody } = await request(app.getHttpServer()).delete('/base/1').expect(HttpStatus.OK);
        expect(deletedBody.col2).toEqual(1);
        expect(deletedBody.col3).toEqual(15);
        expect(deletedBody.createdBy.id).toEqual(author.id);
        expect(deletedBody.createdBy.modifiedAt).toEqual(createdBody.createdBy.modifiedAt);
        expect(deletedBody.updatedBy.id).toEqual(author.id);
        expect(deletedBody.updatedBy.modifiedAt).toEqual(updatedBody.updatedBy.modifiedAt);
        expect(deletedBody.deletedBy.id).toEqual(author.id);
        expect(deletedBody.deletedBy.modifiedAt).toBeDefined();
        expect(deletedBody.deletedAt).toBeDefined();

        const { body: upsertBody } = await request(app.getHttpServer()).put('/base/2').send({ col2: 2, col3: 20 }).expect(HttpStatus.OK);
        expect(upsertBody.col2).toEqual(2);
        expect(upsertBody.createdBy).toBeNull();
        expect(upsertBody.updatedBy.id).toEqual(author.id);
        expect(upsertBody.deletedBy).toBeNull();
        expect(upsertBody.deletedAt).toBeNull();
    });
});
