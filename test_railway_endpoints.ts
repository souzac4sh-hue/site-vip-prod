import http from 'http';
import crypto from 'crypto';

async function validateEndpoints() {
  console.log('🧪 ========================================================');
  console.log('🚀 VALIDANDO ROTAS, CHECKOUT PIX, WEBHOOK E ADMIN');
  console.log('🧪 ========================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(name: string, condition: boolean) {
    if (condition) {
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${name}`);
      failed++;
    }
  }

  function doRequest(options: http.RequestOptions, postData?: string): Promise<{ statusCode: number; headers: http.IncomingHttpHeaders; body: string }> {
    return new Promise((resolve, reject) => {
      const req = http.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => resolve({ statusCode: res.statusCode || 0, headers: res.headers, body }));
      });
      req.on('error', reject);
      if (postData) {
        req.write(postData);
      }
      req.end();
    });
  }

  // 1. GET / (Landing Page)
  try {
    const res = await doRequest({ host: 'localhost', port: 3001, path: '/', method: 'GET' });
    assert('1. GET / (Landing Page Principal) responde com 200 OK', res.statusCode === 200);
  } catch (err: any) {
    assert(`1. GET / falhou: ${err.message}`, false);
  }

  // 2. GET /whatsapp
  try {
    const res = await doRequest({ host: 'localhost', port: 3001, path: '/whatsapp', method: 'GET' });
    assert('2. GET /whatsapp responde com 200 OK', res.statusCode === 200);
  } catch (err: any) {
    assert(`2. GET /whatsapp falhou: ${err.message}`, false);
  }

  // 3. GET /admin
  try {
    const res = await doRequest({ host: 'localhost', port: 3001, path: '/admin', method: 'GET' });
    assert('3. GET /admin responde com 200 OK', res.statusCode === 200);
  } catch (err: any) {
    assert(`3. GET /admin falhou: ${err.message}`, false);
  }

  // 4. POST /api/pix/create
  let createdPaymentId = '';
  try {
    const payload = JSON.stringify({ customerName: 'Comprador Teste', customerEmail: 'teste@email.com', product: 'live_access' });
    const res = await doRequest(
      {
        host: 'localhost',
        port: 3001,
        path: '/api/pix/create',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
          'Origin': 'http://localhost:3001',
        },
      },
      payload
    );
    const json = JSON.parse(res.body);
    createdPaymentId = json.payment?.id || '';
    assert('4. POST /api/pix/create gera cobrança PIX no valor fixado pelo servidor (R$ 9,90)', res.statusCode === 200 && json.success === true && json.payment?.amount === 9.90);
  } catch (err: any) {
    assert(`4. POST /api/pix/create falhou: ${err.message}`, false);
  }

  // 5. POST /api/webhooks/nexuspag (com HMAC)
  try {
    process.env.NEXUSPAG_WEBHOOK_SECRET = 'test_webhook_secret_railway_deploy';
    const rawBody = JSON.stringify({ id: createdPaymentId || 'tx_test_1', amount: 9.90, status: 'paid' });
    const signature = crypto.createHmac('sha256', process.env.NEXUSPAG_WEBHOOK_SECRET).update(rawBody).digest('hex');

    const res = await doRequest(
      {
        host: 'localhost',
        port: 3001,
        path: '/api/webhooks/nexuspag',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(rawBody),
          'x-nexuspag-signature': signature,
          'Origin': 'http://localhost:3001',
        },
      },
      rawBody
    );
    assert('5. POST /api/webhooks/nexuspag valida HMAC e aprova acesso', res.statusCode === 200);
  } catch (err: any) {
    assert(`5. POST /api/webhooks/nexuspag falhou: ${err.message}`, false);
  }

  console.log('\n========================================================');
  console.log(`📊 RESULTADO FINAL: ${passed} PASSADOS | ${failed} FALHOS`);
  console.log('========================================================\n');

  if (failed > 0) process.exit(1);
}

validateEndpoints().catch((err) => {
  console.error('Validation error:', err);
  process.exit(1);
});
