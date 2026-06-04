import data from './readings_500.json' with { type: 'json' };

const BATCH_SIZE = 50;
const sessionId = 'demo_session';

for (let i = 0; i < data.length; i += BATCH_SIZE) {
  const batch = data.slice(i, i + BATCH_SIZE);
  const res = await fetch('https://sleepsense-bgal.onrender.com/api/ingest/batch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, readings: batch }),
  });
  const result = await res.json();
  console.log(`Batch ${i/BATCH_SIZE + 1}: accepted=${result.accepted} total=${result.totalInSession}`);
}