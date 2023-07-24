import { FindOptionsWhere } from 'typeorm';

const encoding = 'base64';

export class PaginationHelper {
    static serialize<T>(entity: FindOptionsWhere<T>): string {
        return Buffer.from(JSON.stringify(entity)).toString(encoding);
    }

    static deserialize<T>(nextCursor?: string): T {
        if (!nextCursor) {
            return {} as T;
        }
        try {
            return JSON.parse(Buffer.from(nextCursor, encoding).toString());
        } catch {
            return {} as T;
        }
    }
}
