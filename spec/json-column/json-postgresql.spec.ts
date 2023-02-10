import 'pg';

import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';

import { JsonColumnEntity, JsonColumnModule, JsonColumnService } from './module';

describe('Search JSON column - PostgreSQL', () => {
    let app: INestApplication;
    let service: JsonColumnService;

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [
                JsonColumnModule,
                TypeOrmModule.forRoot({
                    type: 'postgres',
                    database: process.env.POSTGRESQL_DATABASE_NAME,
                    username: process.env.POSTGRESQL_DATABASE_USERNAME,
                    password: process.env.POSTGRESQL_DATABASE_PASSWORD,
                    entities: [JsonColumnEntity],
                    synchronize: true,
                    logging: true,
                    logger: 'file',
                }),
            ],
        }).compile();
        app = moduleFixture.createNestApplication();
        service = moduleFixture.get<JsonColumnService>(JsonColumnService);

        await service.getRepository.query('DELETE FROM "json_column_entity"');

        await service.getRepository.save([
            service.getRepository.create({ colors: ['Red', 'Violet', 'Black'] }),
            service.getRepository.create({ colors: ['Orange', 'Blue', 'Yellow'] }),
            service.getRepository.create({ colors: ['Orange', 'Green', 'Black'] }),
        ]);

        await app.init();
    });

    describe('[? operator] Does the string exist as a top-level key within the JSON value?', () => {
        it('should search entites that meets operation', async () => {
            const { data } = await service.reservedSearch({
                requestSearchDto: { where: [{ colors: { operator: '?', operand: 'Orange' } }] },
            });
            expect(data).toHaveLength(2);
        });

        it('should return empty array when no record matches', async () => {
            const { data } = await service.reservedSearch({
                requestSearchDto: { where: [{ colors: { operator: '?', operand: 'Gold' } }] },
            });
            expect(data).toHaveLength(0);
        });
    });
});
