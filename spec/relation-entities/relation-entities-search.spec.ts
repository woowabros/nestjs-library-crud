import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { RelationEntitiesModule } from './relation-entities.module';

describe('Relation Entities Search', () => {
    let app: INestApplication;

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [
                RelationEntitiesModule({
                    category: {},
                    writer: {},
                    question: { search: { relations: ['writer', 'category', 'comment'] } },
                    comment: {},
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

    it('should search entity with relations', async () => {
        // Create 2 writers
        const { body: writer1Body } = await request(app.getHttpServer())
            .post('/writer')
            .send({ name: 'writer#1' })
            .expect(HttpStatus.CREATED);
        const { body: writer2Body } = await request(app.getHttpServer())
            .post('/writer')
            .send({ name: 'writer#2' })
            .expect(HttpStatus.CREATED);

        // Create a category
        const { body: categoryBody } = await request(app.getHttpServer())
            .post('/category')
            .send({ name: 'Category#1' })
            .expect(HttpStatus.CREATED);

        // Create a question
        const { body: questionBody } = await request(app.getHttpServer())
            .post('/question')
            .send({ categoryId: categoryBody.id, writerId: writer1Body.id, title: 'Question Title', content: 'Question Content' })
            .expect(HttpStatus.CREATED);

        // Create 2 comments
        await request(app.getHttpServer())
            .post('/comment')
            .send({ questionId: questionBody.id, message: 'Comment Message#1', writerId: writer2Body.id })
            .expect(HttpStatus.CREATED);
        await request(app.getHttpServer())
            .post('/comment')
            .send({ questionId: questionBody.id, message: 'Comment Message#2', writerId: writer1Body.id })
            .expect(HttpStatus.CREATED);

        // Assert response of Search
        const { body: searchQuestionResponseBody } = await request(app.getHttpServer())
            .post('/question/search')
            .send({
                where: [{ title: { operator: 'LIKE', operand: 'Question Title' } }],
            })
            .expect(HttpStatus.OK);

        expect(searchQuestionResponseBody.data).toHaveLength(1);

        expect(searchQuestionResponseBody.data[0]).toEqual({
            id: questionBody.id,
            deletedAt: null,
            createdAt: questionBody.createdAt,
            lastModifiedAt: questionBody.lastModifiedAt,
            categoryId: questionBody.categoryId,
            writerId: questionBody.writerId,
            title: questionBody.title,
            content: questionBody.content,
            category: {
                id: categoryBody.id,
                deletedAt: null,
                createdAt: categoryBody.createdAt,
                lastModifiedAt: categoryBody.lastModifiedAt,
                name: categoryBody.name,
            },
            writer: {
                id: writer1Body.id,
                deletedAt: null,
                createdAt: writer1Body.createdAt,
                lastModifiedAt: writer1Body.lastModifiedAt,
                name: writer1Body.name,
            },
        });
    });
});
