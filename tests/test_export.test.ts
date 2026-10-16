import { test, after } from 'node:test';
import assert from 'node:assert';
import { server, serverReady } from '../server/index.ts';
import { db } from '../server/db/index.ts';
import { generateToken } from '../server/middleware/auth.ts';

after(() => {
  server.close();
});

test('Test Keval Pandya Export', async () => {
  await serverReady;
  const user = db.prepare("SELECT * FROM users WHERE email = 'kevalpandya205@gmail.com'").get() as any;
  assert.ok(user, 'User Keval Pandya should exist');

  const token = generateToken({ id: user.id, email: user.email, displayName: user.display_name });

  // 1. Test 2026-10 export
  const resOct = await fetch('http://localhost:5000/api/export/monthly-xlsx?month=2026-10', {
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log('Oct Export status:', resOct.status);
  const octBuf = await resOct.arrayBuffer();
  console.log('Oct Export byteLength:', octBuf.byteLength);
  assert.strictEqual(resOct.status, 200);
  assert.ok(octBuf.byteLength > 1000);

  // 2. Test 2026-09 export (EMPTY MONTH)
  const resSep = await fetch('http://localhost:5000/api/export/monthly-xlsx?month=2026-09', {
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log('Sep (empty month) status:', resSep.status);
  if (resSep.status !== 200) {
    const errText = await resSep.text();
    console.log('Sep error text:', errText);
  }
  assert.strictEqual(resSep.status, 200);

  // 3. Test 2026-11 export (EMPTY MONTH)
  const resNov = await fetch('http://localhost:5000/api/export/monthly-xlsx?month=2026-11', {
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log('Nov (empty month) status:', resNov.status);
  if (resNov.status !== 200) {
    const errText = await resNov.text();
    console.log('Nov error text:', errText);
  }
  assert.strictEqual(resNov.status, 200);
});
