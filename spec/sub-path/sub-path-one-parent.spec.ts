import { INestApplication, HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import _ from 'lodash';
import request from 'supertest';

import { SubPathModule } from './sub-path.module';

describe('Subpath - one parent parameter', () => {
    let app: INestApplication;

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [SubPathModule()],
        }).compile();
        app = moduleFixture.createNestApplication();
        await app.init();

        await Promise.all(
            _.range(0, 5).map((parentNo) =>
                request(app.getHttpServer())
                    .post(`/parent${parentNo % 2 === 0 ? '0' : '1'}/child`)
                    .send({ name: `writer${parentNo}` })
                    .expect(HttpStatus.CREATED),
            ),
        );
    });

    afterEach(async () => {
        if (app) {
            await app.close();
        }
    });

    it('should meet conditions of parent params - create', async () => {
        const { body } = await request(app.getHttpServer()).post('/parentNew/child').send({ name: 'writerNew' }).expect(HttpStatus.CREATED);
        expect(body.parentId).toEqual('parentNew');
        expect(body.name).toEqual('writerNew');

        const { body: readOneBody } = await request(app.getHttpServer()).get(`/parentNew/child/${body.id}`).expect(HttpStatus.OK);
        expect(readOneBody).toEqual(body);
    });

    it('should meet conditions of parent params - upsert', async () => {
        const { body: body1 } = await request(app.getHttpServer()).put('/parent1/child/1').send({ name: 'changed' }).expect(HttpStatus.OK);
        expect(body1.name).toEqual('changed');

        await request(app.getHttpServer())
            .put('/parent1/child/10')
            .send({ parentId: 'parent3', name: 'changed' })
            .expect(HttpStatus.CONFLICT);

        await request(app.getHttpServer()).put('/parent1/child/10').send({ parentId: 'parent0', name: 'new' }).expect(HttpStatus.CONFLICT);
        await request(app.getHttpServer()).put('/parent1/child/10').send({ parentId: 'parent1', name: 'new' }).expect(HttpStatus.OK);
    });

    it('should meet conditions of parent params - readMany', async () => {
        for (const parentName of ['parent0', 'parent1']) {
            const {
                body: { data: readManyData },
            } = await request(app.getHttpServer()).get(`/${parentName}/child`).expect(HttpStatus.OK);
            for (const data of readManyData) {
                expect(data.parentId).toEqual(parentName);
            }
        }
    });

    it('should meet conditions of parent params - search', async () => {
        const operand = _.range(0, 5).map((parentNo) => `writer${parentNo}`);
        const { body } = await request(app.getHttpServer())
            .post('/parent0/child/search')
            .send({
                where: [{ name: { operator: 'IN', operand } }],
            })
            .expect(HttpStatus.OK);
        expect(body.data).toHaveLength(3);
        for (const data of body.data) {
            expect(data.parentId).toEqual('parent0');
        }
    });
});
