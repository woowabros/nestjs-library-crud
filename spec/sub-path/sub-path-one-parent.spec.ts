import { HttpStatus } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { DepthOneEntity } from './depth-one.entity';
import { SubPathModule } from './sub-path.module';
import { TestHelper } from '../test.helper';

import type { INestApplication } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';

describe('Subpath - one parent parameter', () => {
    let app: INestApplication;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [SubPathModule()],
        }).compile();
        app = moduleFixture.createNestApplication();
        await app.init();
    });

    beforeEach(async () => {
        await DepthOneEntity.delete({});
        await Promise.all(
            Array.from({ length: 5 }, (_, index) => index).map((parentNo) =>
                request(app.getHttpServer())
                    .post(`/parent${parentNo % 2 === 0 ? '0' : '1'}/child`)
                    .send({ name: `writer${parentNo}` })
                    .expect(HttpStatus.CREATED),
            ),
        );
    });

    afterAll(async () => {
        await TestHelper.dropTypeOrmEntityTables();
        await app?.close();
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
        const operand = Array.from({ length: 5 }, (_, index) => index).map((parentNo) => `writer${parentNo}`);
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
