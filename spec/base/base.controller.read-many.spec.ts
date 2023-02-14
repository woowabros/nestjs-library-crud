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

    describe('READ_MANY', () => {
        it('should be provided /', async () => {
            const routerPathList = TestHelper.getRoutePath(app.getHttpServer());
            expect(routerPathList.get).toEqual(expect.arrayContaining(['/base']));
        });
    });
});
