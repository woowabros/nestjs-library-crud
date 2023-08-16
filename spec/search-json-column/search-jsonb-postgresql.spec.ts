import 'pg';

import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { fixtures } from './fixture';
import { JsonbColumnEntity, JsonbColumnModule, JsonbColumnService } from './jsonb.module';
import { TestHelper } from '../test.helper';

describe('Search JSONB column - PostgreSQL', () => {
    let app: INestApplication;
    let service: JsonbColumnService;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [JsonbColumnModule, TestHelper.getTypeOrmPgsqlModule([JsonbColumnEntity])],
        }).compile();
        app = moduleFixture.createNestApplication();
        service = moduleFixture.get<JsonbColumnService>(JsonbColumnService);

        await service.repository.query('DELETE FROM "jsonb_column_entity"');
        await service.repository.save(service.repository.create(fixtures));

        await app.init();
    });

    afterAll(async () => {
        await TestHelper.dropTypeOrmEntityTables();
        await app?.close();
    });

    describe('[? operator] Does the string exist as a top-level key within the JSON value?', () => {
        it('should search entities that meets operation', async () => {
            const {
                body: { data },
            } = await request(app.getHttpServer())
                .post('/jsonb/search')
                .send({ where: [{ colors: { operator: '?', operand: 'Orange' } }] })
                .expect(HttpStatus.OK);
            expect(data).toHaveLength(2);
        });

        it('should return empty array when no record matches', async () => {
            const {
                body: { data },
            } = await request(app.getHttpServer())
                .post('/jsonb/search')
                .send({ where: [{ colors: { operator: '?', operand: 'Gold' } }] })
                .expect(HttpStatus.OK);
            expect(data).toHaveLength(0);
        });
    });

    describe('[@> operator] Does the left JSON value contain the right JSON path/value entries at the top level?', () => {
        it('should search entities that meets operation', async () => {
            const {
                body: { data },
            } = await request(app.getHttpServer())
                .post('/jsonb/search')
                .send({ where: [{ friends: { operator: '@>', operand: '[{ "firstName": "Taylor" }]' } }] })
                .expect(HttpStatus.OK);
            expect(data).toHaveLength(1);

            const {
                body: { data: data2 },
            } = await request(app.getHttpServer())
                .post('/jsonb/search')
                .send({ where: [{ friends: { operator: '@>', operand: '[{ "gender": "Male" }]' } }] })
                .expect(HttpStatus.OK);
            expect(data2).toHaveLength(2);

            const {
                body: { data: data3 },
            } = await request(app.getHttpServer())
                .post('/jsonb/search')
                .send({
                    where: [{ friends: { operator: '@>', operand: '[{ "lastName": "Bon", "email": "mbon2@pagesperso-orange.fr"}]' } }],
                })
                .expect(HttpStatus.OK);
            expect(data3).toHaveLength(1);
        });

        it('should return empty array when no record matches', async () => {
            const {
                body: { data: data },
            } = await request(app.getHttpServer())
                .post('/jsonb/search')
                .send({
                    where: [{ friends: { operator: '@>', operand: '[{ "firstName": "Donghyuk" }]' } }],
                })
                .expect(HttpStatus.OK);
            expect(data).toHaveLength(0);
        });
    });
});
