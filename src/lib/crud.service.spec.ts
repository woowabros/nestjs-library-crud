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

        beforeEach(() => {
            mockRepository.findOne.mockResolvedValueOnce(mockEntity);
        });

        it('should be defined', () => {
            expect(crudService).not.toBeUndefined();
        });

        it('should return entity', async () => {
            await expect(crudService.reservedReadOne({ params: { id: mockEntity.id } as Partial<BaseEntity> })).resolves.toEqual(
                mockEntity,
            );
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
            expect(crudService).not.toBeUndefined();
        });

        it('should not be delete entity, when primary keys not exists ', async () => {
            await expect(
                crudService.reservedDelete({
                    params: {},
                    softDeleted: false,
                }),
            ).rejects.toThrow(ConflictException);
        });
    });
});
