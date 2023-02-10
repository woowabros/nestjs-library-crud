import 'mysql2';

import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Address, Person } from './interface';
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

        await service.getRepository.query('DELETE FROM json_column_entity');

        await service.getRepository.save([
            service.getRepository.create({
                colors: ['Red', 'Violet', 'Black'],
                friends: [],
                address: { city: 'Stockholm', street: '0 Hoard Circle', zip: '111 95' } as Address,
            }),
            service.getRepository.create({
                colors: ['Orange', 'Blue', 'Yellow'],
                friends: [
                    { id: 7, firstName: 'Katharyn', lastName: 'Davidovsky', email: 'kdavidovsky6@tmall.com', gender: 'Female' },
                    { id: 6, firstName: 'Valeria', lastName: 'Loidl', email: 'vloidl5@nasa.gov', gender: 'Female' },
                    { id: 9, firstName: 'Antone', lastName: 'Hartzogs', email: 'ahartzogs8@cdc.gov', gender: 'Male' },
                ] as Person[],
                address: { city: 'Bali', street: '27996 Declaration Lane', zip: '787-0150' } as Address,
            }),
            service.getRepository.create({
                colors: ['Orange', 'Green', 'Black'],
                friends: [
                    { id: 2, firstName: 'Taylor', lastName: 'Ruffles', email: 'truffles1@google.pl', gender: 'Male' },
                    { id: 3, firstName: 'Maggi', lastName: 'Bon', email: 'mbon2@pagesperso-orange.fr', gender: 'Female' },
                ] as Person[],
                address: { city: 'Paris 19', street: '1250 Monica Parkway', zip: '75166 CEDEX 19' } as Address,
            }),
        ]);

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
