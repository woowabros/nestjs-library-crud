import 'pg';

import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';

import { JsonColumnEntity, JsonColumnModule, JsonColumnService, Person } from './module';

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
            service.getRepository.create({ colors: ['Red', 'Violet', 'Black'], friends: [] }),
            service.getRepository.create({
                colors: ['Orange', 'Blue', 'Yellow'],
                friends: [
                    { id: 7, firstName: 'Katharyn', lastName: 'Davidovsky', email: 'kdavidovsky6@tmall.com', gender: 'Female' },
                    { id: 6, firstName: 'Valeria', lastName: 'Loidl', email: 'vloidl5@nasa.gov', gender: 'Female' },
                    { id: 9, firstName: 'Antone', lastName: 'Hartzogs', email: 'ahartzogs8@cdc.gov', gender: 'Male' },
                ] as Person[],
            }),
            service.getRepository.create({
                colors: ['Orange', 'Green', 'Black'],
                friends: [
                    { id: 2, firstName: 'Taylor', lastName: 'Ruffles', email: 'truffles1@google.pl', gender: 'Male' },
                    { id: 3, firstName: 'Maggi', lastName: 'Bon', email: 'mbon2@pagesperso-orange.fr', gender: 'Female' },
                ] as Person[],
            }),
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

    describe('[@> operator] Does the left JSON value contain the right JSON path/value entries at the top level?', () => {
        it('should search entites that meets operation', async () => {
            const { data } = await service.reservedSearch({
                requestSearchDto: { where: [{ friends: { operator: '@>', operand: '[{ "firstName": "Taylor" }]' } }] },
            });
            expect(data).toHaveLength(1);

            const { data: data2 } = await service.reservedSearch({
                requestSearchDto: { where: [{ friends: { operator: '@>', operand: '[{ "gender": "Male" }]' } }] },
            });
            expect(data2).toHaveLength(2);

            const { data: data3 } = await service.reservedSearch({
                requestSearchDto: {
                    where: [{ friends: { operator: '@>', operand: '[{ "lastName": "Bon", "email": "mbon2@pagesperso-orange.fr"}]' } }],
                },
            });
            expect(data3).toHaveLength(1);
        });

        it('should return empty array when no record matches', async () => {
            const { data } = await service.reservedSearch({
                requestSearchDto: { where: [{ friends: { operator: '@>', operand: '[{ "firstName": "Donghyuk" }]' } }] },
            });
            expect(data).toHaveLength(0);
        });
    });
});
