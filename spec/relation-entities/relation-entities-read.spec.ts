import { HttpStatus } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { RelationEntitiesModule } from './relation-entities.module';
import { TestHelper } from '../test.helper';

import type { INestApplication } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';

describe('Relation Entities Read', () => {
    let app: INestApplication;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [
                RelationEntitiesModule({
                    category: {},
                    writer: {},
                    question: {},
                    comment: {
                        readMany: { numberOfTake: 1 },
                    },
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

    it('readOne/readMany with relations', async () => {
        const { body: writer1Body } = await request(app.getHttpServer())
            .post('/writer')
            .send({ name: 'writer#1' })
            .expect(HttpStatus.CREATED);
        expect(writer1Body).toEqual({
            name: 'writer#1',
            deletedAt: null,
            id: expect.any(Number),
            createdAt: expect.any(String),
            lastModifiedAt: expect.any(String),
        });

        const { body: writer2Body } = await request(app.getHttpServer())
            .post('/writer')
            .send({ name: 'writer#2' })
            .expect(HttpStatus.CREATED);
        expect(writer2Body).toEqual({
            name: 'writer#2',
            deletedAt: null,
            id: expect.any(Number),
            createdAt: expect.any(String),
            lastModifiedAt: expect.any(String),
        });

        const { body: categoryBody } = await request(app.getHttpServer())
            .post('/category')
            .send({ name: 'Category#1' })
            .expect(HttpStatus.CREATED);
        expect(categoryBody).toEqual({
            name: 'Category#1',
            deletedAt: null,
            id: expect.any(Number),
            createdAt: expect.any(String),
            lastModifiedAt: expect.any(String),
        });

        const { body: questionBody } = await request(app.getHttpServer())
            .post('/question')
            .send({ categoryId: categoryBody.id, writerId: writer1Body.id, title: 'Question Title', content: 'Question Content' })
            .expect(HttpStatus.CREATED);
        expect(questionBody).toEqual({
            categoryId: categoryBody.id,
            writerId: writer1Body.id,
            title: 'Question Title',
            content: 'Question Content',
            deletedAt: null,
            id: expect.any(Number),
            createdAt: expect.any(String),
            lastModifiedAt: expect.any(String),
        });

        const { body: comment1Body } = await request(app.getHttpServer())
            .post('/comment')
            .send({ questionId: questionBody.id, message: 'Comment Message#1', writerId: writer2Body.id })
            .expect(HttpStatus.CREATED);
        expect(comment1Body).toEqual({
            questionId: questionBody.id,
            message: 'Comment Message#1',
            writerId: writer2Body.id,
            deletedAt: null,
            id: expect.any(Number),
            createdAt: expect.any(String),
            lastModifiedAt: expect.any(String),
        });

        const { body: comment2Body } = await request(app.getHttpServer())
            .post('/comment')
            .send({ questionId: questionBody.id, message: 'Comment Message#2', writerId: writer1Body.id })
            .expect(HttpStatus.CREATED);
        expect(comment2Body).toEqual({
            questionId: questionBody.id,
            message: 'Comment Message#2',
            writerId: writer1Body.id,
            deletedAt: null,
            id: expect.any(Number),
            createdAt: expect.any(String),
            lastModifiedAt: expect.any(String),
        });

        const { body: questionListBody } = await request(app.getHttpServer()).get('/question').expect(HttpStatus.OK);
        expect(questionListBody.data).toHaveLength(1);
        expect(questionListBody.data[0]).toEqual({
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
            comments: [comment1Body, comment2Body],
        });

        const { body: getQuestionBody } = await request(app.getHttpServer()).get(`/question/${questionBody.id}`).expect(HttpStatus.OK);
        expect(getQuestionBody).toEqual({
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
            comments: [comment1Body, comment2Body],
        });

        const { body: commentListBody } = await request(app.getHttpServer())
            .get('/comment')
            .query({ questionId: questionBody.id })
            .expect(HttpStatus.OK);

        expect(commentListBody.data).toHaveLength(1);
        for (const comment of commentListBody.data) {
            expect(comment).toEqual({
                id: expect.any(Number),
                deletedAt: null,
                createdAt: expect.any(String),
                lastModifiedAt: expect.any(String),
                questionId: questionBody.id,
                message: expect.any(String),
                writerId: expect.any(Number),
                writer: {
                    name: comment.writerId === writer1Body.id ? writer1Body.name : writer2Body.name,
                    deletedAt: null,
                    id: comment.writerId,
                    createdAt: comment.writerId === writer1Body.id ? writer1Body.createdAt : writer2Body.createdAt,
                    lastModifiedAt: comment.writerId === writer1Body.id ? writer1Body.lastModifiedAt : writer2Body.lastModifiedAt,
                },
                question: questionBody,
            });
        }

        const { body: commentListBodyNext } = await request(app.getHttpServer())
            .get('/comment')
            .query({ nextCursor: commentListBody.metadata.query })
            .expect(HttpStatus.OK);

        expect(commentListBodyNext.data).toHaveLength(1);
        for (const comment of commentListBodyNext.data) {
            expect(comment).toEqual({
                id: expect.any(Number),
                deletedAt: null,
                createdAt: expect.any(String),
                lastModifiedAt: expect.any(String),
                questionId: questionBody.id,
                message: expect.any(String),
                writerId: expect.any(Number),
                writer: {
                    name: comment.writerId === writer1Body.id ? writer1Body.name : writer2Body.name,
                    deletedAt: null,
                    id: comment.writerId,
                    createdAt: comment.writerId === writer1Body.id ? writer1Body.createdAt : writer2Body.createdAt,
                    lastModifiedAt: comment.writerId === writer1Body.id ? writer1Body.lastModifiedAt : writer2Body.lastModifiedAt,
                },
                question: questionBody,
            });
        }

        const { body: commentBody } = await request(app.getHttpServer())
            .get(`/comment/${commentListBody.data[0].id}`)
            .expect(HttpStatus.OK);
        expect(commentBody).toEqual({
            id: commentListBody.data[0].id,
            deletedAt: null,
            createdAt: commentListBody.data[0].createdAt,
            lastModifiedAt: commentListBody.data[0].lastModifiedAt,
            questionId: commentListBody.data[0].questionId,
            message: commentListBody.data[0].message,
            writerId: commentListBody.data[0].writerId,
            writer: {
                name: commentBody.writerId === writer1Body.id ? writer1Body.name : writer2Body.name,
                deletedAt: null,
                id: commentBody.writerId,
                createdAt: commentBody.writerId === writer1Body.id ? writer1Body.createdAt : writer2Body.createdAt,
                lastModifiedAt: commentBody.writerId === writer1Body.id ? writer1Body.lastModifiedAt : writer2Body.lastModifiedAt,
            },
            question: questionBody,
        });
    });
});
