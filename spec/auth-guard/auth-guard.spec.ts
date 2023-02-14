import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { AuthGuardModule } from './auth-guard.module';
import { BaseEntity } from '../base/base.entity';
import { TestHelper } from '../test.helper';

describe('AuthGuard', () => {
    let app: INestApplication;

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AuthGuardModule, TestHelper.getTypeOrmMysqlModule([BaseEntity])],
        }).compile();

        app = moduleFixture.createNestApplication();

        await app.init();
    });

    afterEach(async () => {
        await TestHelper.dropTypeOrmEntityTables();
        await app?.close();
    });

    it('should be applied to readOne', async () => {
        await request(app.getHttpServer()).get('/auth-guard/1').expect(HttpStatus.FORBIDDEN);

        const authorizedResponse = await request(app.getHttpServer()).get('/auth-guard/1').set('X-API-KEY', 'secret');
        expect(authorizedResponse).not.toEqual(HttpStatus.FORBIDDEN);
    });

    it('should be applied to readMany', async () => {
        await request(app.getHttpServer()).get('/auth-guard').expect(HttpStatus.FORBIDDEN);

        const authorizedResponse = await request(app.getHttpServer()).get('/auth-guard').set('X-API-KEY', 'secret');
        expect(authorizedResponse).not.toEqual(HttpStatus.FORBIDDEN);
    });

    it('should be applied to create', async () => {
        await request(app.getHttpServer()).post('/auth-guard').expect(HttpStatus.FORBIDDEN);

        const authorizedResponse = await request(app.getHttpServer()).post('/auth-guard/1').set('X-API-KEY', 'secret');
        expect(authorizedResponse).not.toEqual(HttpStatus.FORBIDDEN);
    });

    it('should be applied to upsert', async () => {
        await request(app.getHttpServer()).put('/auth-guard/1').expect(HttpStatus.FORBIDDEN);

        const authorizedResponse = await request(app.getHttpServer()).put('/auth-guard/1').set('X-API-KEY', 'secret');
        expect(authorizedResponse).not.toEqual(HttpStatus.FORBIDDEN);
    });

    it('should be applied to update', async () => {
        await request(app.getHttpServer()).patch('/auth-guard/1').expect(HttpStatus.FORBIDDEN);

        const authorizedResponse = await request(app.getHttpServer()).patch('/auth-guard/1').set('X-API-KEY', 'secret');
        expect(authorizedResponse).not.toEqual(HttpStatus.FORBIDDEN);
    });

    it('should be applied to delete', async () => {
        await request(app.getHttpServer()).delete('/auth-guard/1').expect(HttpStatus.FORBIDDEN);

        const authorizedResponse = await request(app.getHttpServer()).delete('/auth-guard/1').set('X-API-KEY', 'secret');
        expect(authorizedResponse).not.toEqual(HttpStatus.FORBIDDEN);
    });

    it('should be applied to recover', async () => {
        await request(app.getHttpServer()).post('/auth-guard/1/recover').expect(HttpStatus.FORBIDDEN);

        const authorizedResponse = await request(app.getHttpServer()).post('/auth-guard/1/recover').set('X-API-KEY', 'secret');
        expect(authorizedResponse).not.toEqual(HttpStatus.FORBIDDEN);
    });

    it('should be applied to search', async () => {
        await request(app.getHttpServer()).post('/auth-guard/search').expect(HttpStatus.FORBIDDEN);

        const authorizedResponse = await request(app.getHttpServer()).post('/auth-guard/search').set('X-API-KEY', 'secret');
        expect(authorizedResponse).not.toEqual(HttpStatus.FORBIDDEN);
    });
});
