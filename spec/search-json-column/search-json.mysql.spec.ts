import 'mysql2';

import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';

import { fixtures } from './fixture';
import { JsonColumnEntity, JsonColumnModule, JsonColumnService } from './json.module';

describe('Search JSON column - MySQL', () => {
    let app: INestApplication;
    let service: JsonColumnService;

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [
                JsonColumnModule,
                TypeOrmModule.forRoot({
                    type: 'mysql',
                    database: process.env.MYSQL_DATABASE_NAME,
                    username: process.env.MYSQL_DATABASE_USERNAME,
                    password: process.env.MYSQL_DATABASE_PASSWORD,
                    entities: [JsonColumnEntity],
                    synchronize: true,
                    logging: true,
                    logger: 'file',
                }),
            ],
        }).compile();
        app = moduleFixture.createNestApplication();
        service = moduleFixture.get<JsonColumnService>(JsonColumnService);

        await service.repository.query('DELETE FROM json_column_entity');
        await service.repository.save(service.repository.create(fixtures));

        await app.init();
    });

    afterAll(async () => {
        if (app) {
            await app.close();
        }
    });

    describe('[JSON_CONTAINS operator] Whether JSON document contains specific object at path', () => {
        it('should search entites that meets operation for array column', async () => {
            const { data } = await service.reservedSearch({
                requestSearchDto: { where: [{ friends: { operator: 'JSON_CONTAINS', operand: '{ "firstName": "Taylor" }' } }] },
            });
            expect(data).toHaveLength(1);

            const { data: data2 } = await service.reservedSearch({
                requestSearchDto: { where: [{ friends: { operator: 'JSON_CONTAINS', operand: '{ "gender": "Male" }' } }] },
            });
            expect(data2).toHaveLength(2);

            const { data: data3 } = await service.reservedSearch({
                requestSearchDto: {
                    where: [
                        {
                            friends: {
                                operator: 'JSON_CONTAINS',
                                operand: '{ "lastName": "Bon", "email": "mbon2@pagesperso-orange.fr"}',
                            },
                        },
                    ],
                },
            });
            expect(data3).toHaveLength(1);
        });

        it('should search entites that meets operation for object column', async () => {
            const { data } = await service.reservedSearch({
                requestSearchDto: { where: [{ address: { operator: 'JSON_CONTAINS', operand: '{ "city": "Bali" }' } }] },
            });
            expect(data).toHaveLength(1);
        });

        it('should return empty array when no record matches', async () => {
            const { data } = await service.reservedSearch({
                requestSearchDto: { where: [{ friends: { operator: 'JSON_CONTAINS', operand: '{ "firstName": "Donghyuk" }' } }] },
            });
            expect(data).toHaveLength(0);
        });
    });
});
