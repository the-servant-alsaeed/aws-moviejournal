import path from 'path';

import "aws-sdk-client-mock-jest";
import dotenv from 'dotenv';

dotenv.config({
    path: path.resolve(__dirname, './unit.env')
});
