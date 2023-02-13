export class TestHelper {
    static getRoutePath(httpServer: any): Record<string, string[]> {
        return httpServer._events.request._router.stack.reduce(
            (list: Record<string, string[]>, r: { route: { path: string; methods: { method: unknown } } }) => {
                if (r.route?.path) {
                    for (const method of Object.keys(r.route.methods)) {
                        list[method] = list[method] ?? [];
                        list[method].push(r.route.path);
                    }
                }
                return list;
            },
            {},
        );
    }
}
