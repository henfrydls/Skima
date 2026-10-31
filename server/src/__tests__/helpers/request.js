import supertest from 'supertest';
import { API_HEADER } from '../../middleware/apiHeader.js';

// supertest as the Skima client calls the API: every request carries the API
// header. Tests of the guard itself use supertest directly.
const METHODS = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'];

export default function request(app) {
  const agent = supertest(app);
  return Object.fromEntries(
    METHODS.map((m) => [m, (url) => agent[m](url).set(API_HEADER, '1')])
  );
}
