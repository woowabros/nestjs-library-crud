import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { EmbeddedEntitiesModule } from './embedded-entities.module';
import { EmployeeEntity } from './employee.entity';
import { EmployeeService } from './employee.service';
import { UserEntity } from './user.entity';
import { TestHelper } from '../test.helper';

describe('Embedded-entities', () => {
    let app: INestApplication;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [EmbeddedEntitiesModule, TestHelper.getTypeOrmPgsqlModule([UserEntity, EmployeeEntity])],
        }).compile();
        app = moduleFixture.createNestApplication();
        await app.init();
    });

    afterAll(async () => {
        const repository = app.get<EmployeeService>(EmployeeService).repository;
        await repository.query('DROP TABLE IF EXISTS user_entity');
        await repository.query('DROP TABLE IF EXISTS employee_entity');
        await app?.close();
    });

    it('should be provided url', async () => {
        const routerPathList = TestHelper.getRoutePath(app.getHttpServer());
        expect(routerPathList.get).toEqual(expect.arrayContaining(['/user/:id', '/user', '/employee/:id', '/employee']));
    });

    it('should be used embedded entity', async () => {
        const { body: created } = await request(app.getHttpServer())
            .post('/user')
            .send({ isActive: true, name: { first: 'firstUserName', last: 'lastUserName' } })
            .expect(HttpStatus.CREATED);

        const { body: readOne } = await request(app.getHttpServer()).get(`/user/${created.id}`).expect(HttpStatus.OK);
        expect(readOne).toEqual({
            id: created.id,
            isActive: true,
            name: { first: 'firstUserName', last: 'lastUserName' },
        });

        const { body: readMany } = await request(app.getHttpServer()).get('/user').expect(HttpStatus.OK);
        expect(readMany.data[0].name).toBeDefined();

        const { body: updated } = await request(app.getHttpServer())
            .patch(`/user/${created.id}`)
            .send({ isActive: false, name: { first: 'updatedFirstUserName', last: 'updatedLastUserName' } })
            .expect(HttpStatus.OK);
        expect(updated).toEqual({
            id: created.id,
            isActive: false,
            name: { first: 'updatedFirstUserName', last: 'updatedLastUserName' },
        });
    });
});
