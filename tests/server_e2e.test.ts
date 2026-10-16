import { test, after } from 'node:test';
import assert from 'node:assert';
import { server, serverReady } from '../server/index.ts';

after(() => {
  server.close();
});

test('E2E Server: Health check and frontend static serving', async () => {
  await serverReady;
  // 1. Health check
  const healthRes = await fetch('http://localhost:5000/api/health');
  assert.strictEqual(healthRes.status, 200);
  const healthData = await healthRes.json();
  assert.strictEqual(healthData.status, 'healthy');

  // 2. Frontend HTML
  const frontendRes = await fetch('http://localhost:5000/');
  assert.strictEqual(frontendRes.status, 200);
  const html = await frontendRes.text();
  assert.ok(html.includes('SpendWise'), 'Frontend HTML should contain SpendWise title');
  assert.ok(html.includes('manifest.json'), 'Frontend HTML should reference manifest.json');
});
