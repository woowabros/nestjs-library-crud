const encoding = 'base64';

export class PaginationHelper {
    static serialize<T>(entity: Partial<T>): string {
        return Buffer.from(JSON.stringify(entity)).toString(encoding);
    }

    static deserialize<T>(token?: string): T {
        if (!token) {
            return {} as T;
        }
        try {
            return JSON.parse(Buffer.from(token, encoding).toString());
        } catch {
            return {} as T;
        }
    }
}
