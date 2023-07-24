import 'pg';

import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { fixtures } from './fixture';
import { JsonbColumnEntity, JsonbColumnModule, JsonbColumnService } from './jsonb.module';
import { TestHelper } from '../test.helper';

describe('Search JSONB column - PostgreSQL', () => {
    let app: INestApplication;
    let service: JsonbColumnService;

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [JsonbColumnModule, TestHelper.getTypeOrmPgsqlModule([JsonbColumnEntity])],
        }).compile();
        app = moduleFixture.createNestApplication();
        service = moduleFixture.get<JsonbColumnService>(JsonbColumnService);

        await service.repository.query('DELETE FROM "jsonb_column_entity"');
        await service.repository.save(service.repository.create(fixtures));

        await app.init();
    });

    afterEach(async () => {
        await TestHelper.dropTypeOrmEntityTables();
        await app?.close();
    });

    describe('[? operator] Does the string exist as a top-level key within the JSON value?', () => {
        it('should search entities that meets operation', async () => {
            const { data } = await service.reservedSearch({
                requestSearchDto: { where: [{ colors: { operator: '?', operand: 'Orange' } }] },
                relations: [],
            });
            expect(data).toHaveLength(2);
        });

        it('should return empty array when no record matches', async () => {
            const { data } = await service.reservedSearch({
                requestSearchDto: { where: [{ colors: { operator: '?', operand: 'Gold' } }] },
                relations: [],
            });
            expect(data).toHaveLength(0);
        });
    });

    describe('[@> operator] Does the left JSON value contain the right JSON path/value entries at the top level?', () => {
        it('should search entities that meets operation', async () => {
            const { data } = await service.reservedSearch({
                requestSearchDto: { where: [{ friends: { operator: '@>', operand: '[{ "firstName": "Taylor" }]' } }] },
                relations: [],
            });
            expect(data).toHaveLength(1);

            const { data: data2 } = await service.reservedSearch({
                requestSearchDto: { where: [{ friends: { operator: '@>', operand: '[{ "gender": "Male" }]' } }] },
                relations: [],
            });
            expect(data2).toHaveLength(2);

            const { data: data3 } = await service.reservedSearch({
                requestSearchDto: {
                    where: [{ friends: { operator: '@>', operand: '[{ "lastName": "Bon", "email": "mbon2@pagesperso-orange.fr"}]' } }],
                },
                relations: [],
            });
            expect(data3).toHaveLength(1);
        });

        it('should return empty array when no record matches', async () => {
            const { data } = await service.reservedSearch({
                requestSearchDto: { where: [{ friends: { operator: '@>', operand: '[{ "firstName": "Donghyuk" }]' } }] },
                relations: [],
            });
            expect(data).toHaveLength(0);
        });
    });
});
