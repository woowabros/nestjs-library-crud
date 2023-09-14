import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import request from 'supertest';

import { BaseEntity } from '../base/base.entity';
import { BaseModule } from '../base/base.module';
import { TestHelper } from '../test.helper';

describe('replication', () => {
    let app: INestApplication;
    beforeAll(async () => {
        const [moduleFixture] = await Promise.all([
            Test.createTestingModule({
                imports: [
                    BaseModule,
                    TypeOrmModule.forRoot({
                        type: 'postgres',
                        entities: [BaseEntity],
                        synchronize: true,
                        logging: true,
                        logger: 'file',
                        replication: {
                            master: {
                                database: process.env.POSTGRESQL_DATABASE_NAME,
                                username: process.env.POSTGRESQL_DATABASE_USERNAME,
                                password: process.env.POSTGRESQL_DATABASE_PASSWORD,
                            },
                            slaves: [
                                {
                                    port: Number(process.env.POSTGRESQL_SLAVE_PORT),
                                    database: process.env.POSTGRESQL_DATABASE_NAME,
                                    username: process.env.POSTGRESQL_DATABASE_USERNAME,
                                    password: process.env.POSTGRESQL_DATABASE_PASSWORD,
                                },
                            ],
                        },
                    }),
                ],
            }).compile(),
            await Test.createTestingModule({
                imports: [
                    BaseModule,
                    TypeOrmModule.forRoot({
                        type: 'postgres',
                        entities: [BaseEntity],
                        port: Number(process.env.POSTGRESQL_SLAVE_PORT),
                        database: process.env.POSTGRESQL_DATABASE_NAME,
                        username: process.env.POSTGRESQL_DATABASE_USERNAME,
                        password: process.env.POSTGRESQL_DATABASE_PASSWORD,
                        synchronize: true,
                        logging: true,
                        logger: 'file',
                    }),
                ],
            }).compile(),
        ]);
        app = moduleFixture.createNestApplication();
        await app.init();
    });

    afterAll(async () => {
        await TestHelper.dropTypeOrmEntityTables();
        await app?.close();
    });

    it('is not able to read lately created entity if replication lag exists', async () => {
        const name = 'replication-test';
        const { body: created } = await request(app.getHttpServer()).post('/base').send({ name }).expect(HttpStatus.CREATED);

        await request(app.getHttpServer()).get(`/base/${created.id}`).expect(HttpStatus.NOT_FOUND);
    });

    it('should be able to get result of lately updated or deleted entity even if replication lag exists', async () => {
        const name = 'replication-test';
        const { body: created } = await request(app.getHttpServer()).post('/base').send({ name }).expect(HttpStatus.CREATED);

        await request(app.getHttpServer()).get(`/base/${created.id}`).expect(HttpStatus.NOT_FOUND);

        const { body: updated } = await request(app.getHttpServer())
            .patch(`/base/${created.id}`)
            .send({ name: 'new Name' })
            .expect(HttpStatus.OK);
        expect(updated.id).toEqual(created.id);
        expect(updated.name).toEqual('new Name');

        const { body: deleted } = await request(app.getHttpServer()).delete(`/base/${created.id}`).expect(HttpStatus.OK);
        expect(deleted.id).toEqual(created.id);

        const { body: recovered } = await request(app.getHttpServer()).post(`/base/${created.id}/recover`).expect(HttpStatus.CREATED);
        expect(recovered.id).toEqual(created.id);
    });
});
