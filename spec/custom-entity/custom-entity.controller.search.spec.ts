import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { CustomEntity } from './custom-entity.entity';
import { CustomEntityModule } from './custom-entity.module';
import { CustomEntityService } from './custom-entity.service';
import { TestHelper } from '../test.helper';

describe('CustomEntity - Search', () => {
    let app: INestApplication;
    let service: CustomEntityService;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [CustomEntityModule, TestHelper.getTypeOrmMysqlModule([CustomEntity])],
        }).compile();
        app = moduleFixture.createNestApplication();

        service = moduleFixture.get<CustomEntityService>(CustomEntityService);
        await service.repository.save(
            Array.from({ length: 100 }, (_, index) => index).map((number) => ({ uuid: `${number}`, name: `name-${number}` })),
        );

        await service.repository.save(service.repository.create({ uuid: 'test' }));
        await app.init();
    });

    afterAll(async () => {
        await TestHelper.dropTypeOrmEntityTables();
        await app?.close();
    });

    it('should be provided /search', async () => {
        const routerPathList = TestHelper.getRoutePath(app.getHttpServer());
        expect(routerPathList.post).toEqual(expect.arrayContaining(['/base/search']));
    });

    describe('SEARCH', () => {
        it('should return only one entity', async () => {
            const uuid = '12';
            const response = await request(app.getHttpServer())
                .post('/base/search')
                .send({ where: [{ uuid: { operator: '=', operand: uuid } }] });
            expect(response.statusCode).toEqual(HttpStatus.OK);
            expect(response.body.data).toHaveLength(1);
            expect(response.body.data[0]).toEqual({
                uuid,
                name: 'name-12',
                descriptions: null,
                deletedAt: null,
            });

            const responseSelectedName = await request(app.getHttpServer())
                .post('/base/search')
                .send({ select: ['uuid', 'name'], where: [{ uuid: { operator: '=', operand: uuid } }] });
            expect(responseSelectedName.statusCode).toEqual(HttpStatus.OK);
            expect(responseSelectedName.body.data).toHaveLength(1);
            expect(responseSelectedName.body.data[0]).toEqual({
                uuid,
                name: 'name-12',
            });
        });
        it('should return multiple entities', async () => {
            const response = await request(app.getHttpServer())
                .post('/base/search')
                .send({ where: [{ uuid: { operator: '=', operand: '1' } }, { uuid: { operator: '=', operand: '10' } }] });
            expect(response.statusCode).toEqual(HttpStatus.OK);
            expect(response.body.data).toHaveLength(2);
            expect(response.body.data.map((d: { uuid: string }) => d.uuid)).toEqual(expect.arrayContaining(['1', '10']));
        });

        it('should return entities filtered by null', async () => {
            const response = await request(app.getHttpServer())
                .post('/base/search')
                .send({
                    where: [{ name: { operator: 'NULL' } }],
                });
            expect(response.statusCode).toEqual(HttpStatus.OK);
            expect(response.body.data).toHaveLength(1);
            expect(response.body.data[0].name).toBeNull();

            const responseNotNull = await request(app.getHttpServer())
                .post('/base/search')
                .send({
                    where: [{ name: { operator: 'NULL', not: true } }],
                });
            expect(responseNotNull.statusCode).toEqual(HttpStatus.OK);
            expect(responseNotNull.body.data[0].name).not.toBeNull();
            expect(responseNotNull.body.data.length).toBeGreaterThan(10);
        });
    });
});
