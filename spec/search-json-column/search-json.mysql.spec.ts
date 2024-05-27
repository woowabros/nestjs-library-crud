import 'mysql2';

import { HttpStatus } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { fixtures } from './fixture';
import { JsonColumnEntity, JsonColumnModule, JsonColumnService } from './json.module';
import { TestHelper } from '../test.helper';

import type { INestApplication } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';

describe('Search JSON column - MySQL', () => {
    let app: INestApplication;
    let service: JsonColumnService;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [JsonColumnModule, TestHelper.getTypeOrmMysqlModule([JsonColumnEntity])],
        }).compile();
        app = moduleFixture.createNestApplication();
        service = moduleFixture.get<JsonColumnService>(JsonColumnService);

        await service.repository.query('DELETE FROM json_column_entity');
        await service.repository.save(service.repository.create(fixtures));

        await app.init();
    });

    afterAll(async () => {
        await TestHelper.dropTypeOrmEntityTables();
        await app?.close();
    });

    describe('[JSON_CONTAINS operator] Whether JSON document contains specific object at path', () => {
        it('should search entities that meets operation for array column', async () => {
            const {
                body: { data },
            } = await request(app.getHttpServer())
                .post('/json/search')
                .send({ where: [{ friends: { operator: 'JSON_CONTAINS', operand: '{ "firstName": "Taylor" }' } }] })
                .expect(HttpStatus.OK);
            expect(data).toHaveLength(1);

            const {
                body: { data: data2 },
            } = await request(app.getHttpServer())
                .post('/json/search')
                .send({ where: [{ friends: { operator: 'JSON_CONTAINS', operand: '{ "gender": "Male" }' } }] })
                .expect(HttpStatus.OK);
            expect(data2).toHaveLength(2);

            const {
                body: { data: data3 },
            } = await request(app.getHttpServer())
                .post('/json/search')
                .send({
                    where: [
                        {
                            friends: {
                                operator: 'JSON_CONTAINS',
                                operand: '{ "lastName": "Bon", "email": "mbon2@pagesperso-orange.fr"}',
                            },
                        },
                    ],
                })
                .expect(HttpStatus.OK);
            expect(data3).toHaveLength(1);
        });

        it('should search entities that meets operation for object column', async () => {
            const {
                body: { data },
            } = await request(app.getHttpServer())
                .post('/json/search')
                .send({ where: [{ address: { operator: 'JSON_CONTAINS', operand: '{ "city": "Bali" }' } }] })
                .expect(HttpStatus.OK);
            expect(data).toHaveLength(1);
        });

        it('should return empty array when no record matches', async () => {
            const {
                body: { data },
            } = await request(app.getHttpServer())
                .post('/json/search')
                .send({ where: [{ friends: { operator: 'JSON_CONTAINS', operand: '{ "firstName": "Donghyuk" }' } }] })
                .expect(HttpStatus.OK);
            expect(data).toHaveLength(0);
        });
    });
});
