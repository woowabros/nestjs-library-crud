import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { BaseEntity } from './base.entity';
import { BaseModule } from './base.module';
import { TestHelper } from '../test.helper';

describe('BaseController', () => {
    let app: INestApplication;

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [BaseModule, TestHelper.getTypeOrmMysqlModule([BaseEntity])],
        }).compile();
        app = moduleFixture.createNestApplication();

        await app.init();
    });

    afterEach(async () => {
        await TestHelper.dropTypeOrmEntityTables();
        await app?.close();
    });

    describe('SEARCH', () => {
        it('should be provided /search', async () => {
            const routerPathList = TestHelper.getRoutePath(app.getHttpServer());
            expect(routerPathList.post).toEqual(expect.arrayContaining(['/base/search']));
        });
    });
});
