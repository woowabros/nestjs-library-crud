import 'reflect-metadata';

import { Constants } from './constants';
import { Method } from './interface';
import { Override } from './override.decorator';

describe('@Override', () => {
    it('should mark the method has been overridden', () => {
        class Test {
            @Override(Method[Method.READ_ONE])
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            public static testMethod() {}
        }

        const metadata = Reflect.getMetadata(Constants.OVERRIDE_METHOD_METADATA, Test.testMethod);
        expect(metadata).toBe(Method[Method.READ_ONE]);
    });
});
