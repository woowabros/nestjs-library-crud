import { HttpStatus, INestApplication, forwardRef } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import request from 'supertest';

import { CustomServiceController } from './custom-service.controller';
import { CustomServiceService } from './custom-service.service';
import { BaseEntity } from '../base/base.entity';
import { TestHelper } from '../test.helper';

describe('Custom Service', () => {
    let app: INestApplication;

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [forwardRef(() => TestHelper.getTypeOrmMysqlModule([BaseEntity])), TypeOrmModule.forFeature([BaseEntity])],
            controllers: [CustomServiceController],
            providers: [CustomServiceService],
        }).compile();

        app = moduleFixture.createNestApplication();

        await app.init();
    });

    afterEach(async () => {
        await TestHelper.dropTypeOrmEntityTables();
        await app?.close();
    });

    it('should invoke override method in service', async () => {
        const routerPathList = TestHelper.getRoutePath(app.getHttpServer());
        expect(routerPathList.post).toEqual(expect.arrayContaining(['/test']));
        expect(routerPathList.delete).toEqual(expect.arrayContaining(['/test/:id']));

        let response = await request(app.getHttpServer()).post('/test').send({ name: 'test' });

        expect(response.statusCode).toEqual(HttpStatus.CREATED);
        expect(response.body.result).toEqual('ok');
        expect(response.body.payload).toBeDefined();
        expect(response.body.payload.body.name).toEqual('test');

        response = await request(app.getHttpServer()).delete('/test/1').send();

        expect(response.statusCode).toEqual(HttpStatus.OK);
        expect(response.body.result).toEqual('ok');
        expect(response.body.payload).toBeDefined();
        expect(response.body.payload.params.id).toEqual(1);
    });

    it('should invoke default method if non override', async () => {
        const routerPathList = TestHelper.getRoutePath(app.getHttpServer());
        expect(routerPathList.patch).toEqual(expect.arrayContaining(['/test/:id']));

        const response = await request(app.getHttpServer()).patch('/test/1').send({});

        expect(response.statusCode).toEqual(HttpStatus.NOT_FOUND);
    });

    it('should invoke default method if using wrong method', async () => {
        const routerPathList = TestHelper.getRoutePath(app.getHttpServer());
        expect(routerPathList.get).toEqual(expect.arrayContaining(['/test/:id']));

        const response = await request(app.getHttpServer()).get('/test/1').send();

        expect(response.statusCode).toEqual(HttpStatus.NOT_FOUND);
    });
});
