import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { RelationEntitiesModule } from './relation-entities.module';
import { TestHelper } from '../test.helper';

describe('disable relation option', () => {
    let app: INestApplication;

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [
                RelationEntitiesModule({
                    category: {},
                    writer: {},
                    question: {
                        readOne: {
                            relations: ['writer'],
                        },
                    },
                    comment: {
                        readMany: {
                            relations: [],
                        },
                    },
                }),
            ],
        }).compile();
        app = moduleFixture.createNestApplication();
        await app.init();
    });

    afterEach(async () => {
        await TestHelper.dropTypeOrmEntityTables();
        await app?.close();
    });

    it('should not be returned relation entity, when disabled relation option', async () => {
        const { body: writerBody } = await request(app.getHttpServer())
            .post('/writer')
            .send({ name: 'writerName' })
            .expect(HttpStatus.CREATED);
        const { body: categoryBody } = await request(app.getHttpServer())
            .post('/category')
            .send({ name: 'Category#1' })
            .expect(HttpStatus.CREATED);
        await request(app.getHttpServer())
            .post('/question')
            .send({ categoryId: categoryBody.id, writerId: writerBody.id, title: 'Question#1 Title', content: 'Question#1 Content' })
            .expect(HttpStatus.CREATED);
        await request(app.getHttpServer())
            .post('/question')
            .send({ categoryId: categoryBody.id, writerId: writerBody.id, title: 'Question#2 Title', content: 'Question#2 Content' })
            .expect(HttpStatus.CREATED);

        const { body: questionListBody } = await request(app.getHttpServer()).get('/question').expect(HttpStatus.OK);
        expect(questionListBody.data).toHaveLength(2);
        for (const questionData of questionListBody.data) {
            expect(questionData.writer).toBeDefined();
            expect(questionData.category).toBeDefined();

            const { body: questionBody } = await request(app.getHttpServer()).get(`/question/${questionData.id}`).expect(HttpStatus.OK);
            expect(questionBody.writer).toBeDefined();
            expect(questionBody.category).not.toBeDefined();
        }
    });
});
