import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { InheritanceEntityB } from './inheritance-b-entity';
import { TestHelper } from '../../test.helper';
import { InheritanceModule } from '../inheritance.module';

describe('InheritanceControllerB', () => {
    let app: INestApplication;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [InheritanceModule, TestHelper.getTypeOrmMysqlModule([InheritanceEntityB])],
        }).compile();
        app = moduleFixture.createNestApplication();

        await app.init();
    });

    afterAll(async () => {
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
