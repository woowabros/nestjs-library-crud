import { ConflictException } from '@nestjs/common';
import { BaseEntity, Repository } from 'typeorm';

import { CrudService } from './crud.service';
import { EntityType } from './interface';

describe('CrudService', () => {
    describe('reservedReadOne', () => {
        const mockRepository = {
            metadata: {
                primaryColumns: [{ propertyName: 'id' }],
                columns: [{ databaseName: 'id' }, { databaseName: 'name1' }],
            },
            findOne: jest.fn(),
        };
        const crudService = new CrudService(mockRepository as unknown as Repository<EntityType>);
        const mockEntity = { id: 1, name: 'name1' };

        beforeAll(() => {
            mockRepository.findOne.mockResolvedValueOnce(mockEntity);
        });

        it('should be defined', () => {
            expect(crudService).toBeDefined();
        });

        it('should return entity', async () => {
            await expect(
                crudService.reservedReadOne({
                    params: { id: mockEntity.id } as Partial<BaseEntity>,
                    relations: [],
                }),
            ).resolves.toEqual(mockEntity);
        });
    });

    describe('reservedDelete', () => {
        const mockRepository = {
            metadata: {
                primaryColumns: [],
                columns: [{ databaseName: 'id' }, { databaseName: 'name1' }],
            },
        };
        const crudService = new CrudService(mockRepository as unknown as Repository<EntityType>);

        it('should be defined', () => {
            expect(crudService).toBeDefined();
        });

        it('should not be delete entity, when primary keys not exists ', async () => {
            await expect(
                crudService.reservedDelete({
                    params: {},
                    softDeleted: false,
                    exclude: new Set(),
                }),
            ).rejects.toThrow(ConflictException);
        });
    });

    describe('reservedReadMany', () => {
        it('should log error and throw error when error occurred', async () => {
            const mockRepository = {
                metadata: {
                    primaryColumns: [{ propertyName: 'id' }],
                    columns: [{ databaseName: 'id' }, { databaseName: 'name1' }],
                },
                find: jest.fn(),
            };
            const crudService = new CrudService(mockRepository as unknown as Repository<EntityType>);
            await expect(crudService.reservedReadMany({ key: 'value', array: [{ key: 'value' }] } as any)).rejects.toThrow(Error);
        });
    });
});
