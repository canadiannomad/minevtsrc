import 'source-map-support/register';
import { v1 as uuidv1 } from 'uuid';
import {QueueOptions } from '../src/lib/types';
import { Event, EventDirection, PayloadHTTP, PayloadHTTPMethod } from '../src/lib/types';
import eventqueue from '../src';
import logger from '../src/lib/logger';

import * as events from './events';

const log = logger('Integration Tests');

process.on('warning', (e) => log.warn(e.stack));
process.on('unhandledRejection', (err) => {
  try {
    (log.error || console.error)(err); // tslint:disable-line no-console
  } catch (e) {
    console.log('Double uncaught:', e, err); // tslint:disable-line no-console
  }
  process.exit(1); // tslint:disable-line no-process-exit
});

const init = async () => {
  const options: QueueOptions = {
    s3Bucket: 'lambdamapreduce',
    testMode: true,
    events
  };
  eventqueue.setup(options);
  await eventqueue.initializeQueues(events);
  log.info('Done initiate queues');
  await testHTTPRequest();
};

const testHTTPRequest = async () => {
  const payload: PayloadHTTP = {
    payloadType: 'HTTP',
    payloadVersion: '0.0.1',
    requestId: uuidv1(),
    method: PayloadHTTPMethod.Get,
    path: '/',
    call: 'helloworld',
    parameters: {},
    body: {
      event: {
        body: {
          message: {
            chat: { id: 1 },
            from: {
              first_name: 'Test',
              language_code: 'en',
            },
            text: 'This is a test',
          },
        },
      },
    },
  };

  const evt: Event<PayloadHTTP> = {
    direction: EventDirection.Incoming,
    source: 'HTTP',
    sourceVersion: '0.0.1',
    date: new Date().toJSON(),
    hops: 1,
    cost: '0.00',
    rawPayload: {},
    payload,
  };
  
  await eventqueue.send('PayloadHTTP', evt);
};

init();
