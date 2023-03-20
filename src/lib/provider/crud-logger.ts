import { LoggerService, LogLevel } from '@nestjs/common';
import { Request } from 'express';

export class CrudLogger {
    constructor(private readonly logService?: LoggerService, private readonly logLevel: LogLevel = 'debug') {}

    log(message: any, context?: string) {
        if (!this.logService) {
            return;
        }
        this.logService[this.logLevel]?.(message, ['CRUD', context].filter(Boolean).join(' '));
    }

    interceptor(req: Request | Record<string, unknown>, routeArg: unknown) {
        this.log(routeArg, `${req.method} ${req.url}`);
    }
}
