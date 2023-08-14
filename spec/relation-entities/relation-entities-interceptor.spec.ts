import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { CommentRelationInterceptor } from './comment-relation.interceptor';
import { RelationEntitiesModule } from './relation-entities.module';
import { TestHelper } from '../test.helper';

describe('relation interceptor', () => {
    let app: INestApplication;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [
                RelationEntitiesModule({
                    category: {},
                    writer: {},
                    question: {},
                    comment: {
                        readOne: {
                            interceptors: [CommentRelationInterceptor],
                        },
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

    it('should be returned different relation entity, Depending on option by custom request interceptor', async () => {
        const { body: writer1Body } = await request(app.getHttpServer())
            .post('/writer')
            .send({ name: 'writer#1' })
            .expect(HttpStatus.CREATED);
        const { body: writer2Body } = await request(app.getHttpServer())
            .post('/writer')
            .send({ name: 'writer#2' })
            .expect(HttpStatus.CREATED);
        const { body: categoryBody } = await request(app.getHttpServer())
            .post('/category')
            .send({ name: 'Category#1' })
            .expect(HttpStatus.CREATED);
        const { body: questionBody } = await request(app.getHttpServer())
            .post('/question')
            .send({ categoryId: categoryBody.id, writerId: writer1Body.id, title: 'Question Title', content: 'Question Content' })
            .expect(HttpStatus.CREATED);
        await request(app.getHttpServer())
            .post('/comment')
            .send({ questionId: questionBody.id, message: 'Comment Message#1', writerId: writer2Body.id })
            .expect(HttpStatus.CREATED);
        await request(app.getHttpServer())
            .post('/comment')
            .send({ questionId: questionBody.id, message: 'Comment Message#2', writerId: writer1Body.id })
            .expect(HttpStatus.CREATED);

        const { body: commentListBody } = await request(app.getHttpServer())
            .get('/comment')
            .query({ questionId: questionBody.id })
            .expect(HttpStatus.OK);
        for (const comment of commentListBody.data) {
            expect(comment.writer).toBeDefined();
            const { body: commentBody } = await request(app.getHttpServer()).get(`/comment/${comment.id}`).expect(HttpStatus.OK);

            if (comment.id % 2 === 0) {
                expect(commentBody.writer).toBeDefined();
            } else {
                expect(commentBody.writer).toBeUndefined();
            }
        }
    });
});
