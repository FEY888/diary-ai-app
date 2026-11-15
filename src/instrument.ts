// Import with `const Sentry = require("@sentry/nestjs");` if you are using CJS
import * as Sentry from '@sentry/nestjs';

Sentry.init({
  dsn: 'https://43ba0e8a8b80d841b96e4e119680ea73@o4512436437581824.ingest.us.sentry.io/4512436442890240',

  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  enabled: process.env.NODE_ENV === 'production',
  environment: process.env.NODE_ENV ?? 'local',

  dataCollection: {
    userInfo: false,
    cookies: false,
    httpHeaders: false,
    httpBodies: [],
    urlQueryParams: false,
    genAI: {
      inputs: false,
      outputs: false,
    },
    databaseQueryData: false,
    stackFrameVariables: false,
  },
});
