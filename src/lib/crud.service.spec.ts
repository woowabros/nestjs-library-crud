import { ConflictException } from '@nestjs/common';
import { BaseEntity, Repository } from 'typeorm';

import { CrudService } from './crud.service';

describe('CrudService', () => {
    describe('reservedReadOne', () => {
        const mockRepository = {
            metadata: {
                primaryColumns: [{ propertyName: 'id' }],
            },
            findOne: jest.fn(),
        };
        const crudService = new CrudService<BaseEntity>(mockRepository as unknown as Repository<BaseEntity>);
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
                    exclude: new Set(),
                }),
            ).resolves.toEqual(mockEntity);
        });
    });

    describe('reservedDelete', () => {
        const mockRepository = {
            metadata: {
                primaryColumns: [],
            },
        };
        const crudService = new CrudService<BaseEntity>(mockRepository as unknown as Repository<BaseEntity>);

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
                },
                find: jest.fn(),
            };
            const crudService = new CrudService<BaseEntity>(mockRepository as unknown as Repository<BaseEntity>);
            await expect(crudService.reservedReadMany({ key: 'value', array: [{ key: 'value' }] } as any)).rejects.toThrow(Error);
        });
    });
});
