import { HttpStatus } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { SubPathModule } from './sub-path.module';
import { TestHelper } from '../test.helper';

import type { INestApplication } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';

describe('Subpath - more then one parent parameter', () => {
    let app: INestApplication;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [SubPathModule()],
        }).compile();
        app = moduleFixture.createNestApplication();
        await app.init();

        /**
         * | parentId | subId | name          |
         * | -------- | ----- | ------------- |
         * | parent0  | 0     | writer0, 2, 4 |
         * | parent0  | 1     | writer6, 8    |
         * | parent1  | 0     | writer1, 3    |
         * | parent1  | 1     | writer5, 7, 9 |
         */
        for (let i = 0; i < 10; i++) {
            await request(app.getHttpServer())
                .post(`/parent${i % 2 === 0 ? '0' : '1'}/sub/${i < 5 ? 0 : 1}/child`)
                .send({ name: `writer${i}` })
                .expect(HttpStatus.CREATED);
        }
    });

    afterAll(async () => {
        await TestHelper.dropTypeOrmEntityTables();
        await app?.close();
    });

    it('should meet conditions of parent params - create', async () => {
        const { body } = await request(app.getHttpServer())
            .post('/parentNew/sub/88/child')
            .send({ name: 'writerNew' })
            .expect(HttpStatus.CREATED);
        expect(body.parentId).toEqual('parentNew');
        expect(body.subId).toEqual(88);
        expect(body.name).toEqual('writerNew');

        const { body: readOneBody } = await request(app.getHttpServer()).get(`/parentNew/sub/88/child/${body.id}`).expect(HttpStatus.OK);
        expect(readOneBody).toEqual(body);
    });

    it('should meet conditions of parent params - upsert', async () => {
        const { body: body1 } = await request(app.getHttpServer())
            .put('/parent1/sub/0/child/1')
            .send({ name: 'changed' })
            .expect(HttpStatus.OK);
        expect(body1.name).toEqual('changed');

        await request(app.getHttpServer())
            .put('/parent1/sub/1/child/10')
            .send({ parentId: 'parent3', name: 'changed' })
            .expect(HttpStatus.CONFLICT);

        await request(app.getHttpServer()).put('/parent1/sub/1/child/10').send({ subId: 0, name: 'changed' }).expect(HttpStatus.CONFLICT);

        await request(app.getHttpServer())
            .put('/parent1/sub/0/child/1')
            .send({ parentId: 'parent1', name: 'changed' })
            .expect(HttpStatus.OK);

        await request(app.getHttpServer()).put('/parent1/sub/0/child/1').send({ subId: 0, name: 'changed' }).expect(HttpStatus.OK);
    });

    it('should meet conditions of parent params - readMany', async () => {
        for (const parentName of ['parent0', 'parent1']) {
            for (const subId of [0, 1]) {
                const {
                    body: { data: readManyData },
                } = await request(app.getHttpServer()).get(`/${parentName}/sub/${subId}/child`).expect(HttpStatus.OK);
                for (const data of readManyData) {
                    expect(data.parentId).toEqual(parentName);
                    expect(data.subId).toEqual(subId);
                }
            }
        }
    });

    it('should meet conditions of parent params - search', async () => {
        const operand = Array.from({ length: 10 }, (_, index) => index).map((parentNo) => `writer${parentNo}`);
        for (const parentName of ['parent0', 'parent1']) {
            for (const subId of [0, 1]) {
                const { body } = await request(app.getHttpServer())
                    .post(`/${parentName}/sub/${subId}/child/search`)
                    .send({
                        where: [{ name: { operator: 'IN', operand } }],
                    })
                    .expect(HttpStatus.OK);
                for (const data of body.data) {
                    expect(data.parentId).toEqual(parentName);
                    expect(data.subId).toEqual(subId);
                }
            }
        }
    });
});
