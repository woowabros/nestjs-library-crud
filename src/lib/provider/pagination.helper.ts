const encoding = 'base64';
export class PaginationHelper {
    static serialize<T>(entity: Partial<T>): string {
        return Buffer.from(JSON.stringify(entity)).toString(encoding);
    }

    static deserialize(token?: string): Record<string, string> {
        if (!token) {
            return {};
        }
        try {
            return JSON.parse(Buffer.from(token, encoding).toString());
        } catch {
            return {};
        }
    }
}
