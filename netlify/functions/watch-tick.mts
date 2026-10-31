// Netlify: send whatever is due, once an hour.
import { tick } from '../../src/watch-service/service.ts';
import { deps } from './api.mts';

export default async () => {
  const result = await tick(deps());
  return new Response(JSON.stringify(result), { headers: { 'Content-Type': 'application/json' } });
};

export const config = { schedule: '@hourly' };
