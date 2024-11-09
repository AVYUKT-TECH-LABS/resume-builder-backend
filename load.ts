import { check, sleep } from 'k6';
import http from 'k6/http';

export const options = {
  scenarios: {
    executor: 'constant-arrival-rate',
    rate: 1000,
    timeUnit: '1s',
    duration: '10m',
    preAllocatedVUs: 100,
    maxVUs: 200,
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<500'],
  },
};

export default function () {
  const response = http.get('https://api.talentxcel.net/v1');

  check(response, {
    'is status 200': (r) => r.status == 200,
    'transaction time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(0.1);
}

export function setup() {
  console.log('starting');
}

export function teardown() {
  console.log('Complete');
}
