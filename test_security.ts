import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import {
  createAdminSessionToken,
  validateAdminSessionToken,
  revokeAdminSessionToken,
  verifyAdminPassword,
  checkAdminLoginRateLimit,
  recordAdminLoginAttempt,
} from './server/services/authService.js';
import { nexusPagService } from './server/services/nexusPagService.js';
import { verifyTurnstileToken } from './server/middleware/antiBot.js';
import { validateTrackEvent, sanitizeConfigUpdates } from './server/middleware/securityValidators.js';

async function runSecuritySuite() {
  console.log('🧪 ========================================================');
  console.log('🔒 INICIANDO TESTES NEGATIVOS E VALIDAÇÃO DE SEGURANÇA V2.4');
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

  const mockReq: any = {
    ip: '192.168.1.100',
    headers: { 'user-agent': 'SecurityTestRunner/1.0' },
  };

  // 1. Teste: Reutilização do Cookie / Token após Logout
  console.log('\n--- 1. ADMIN SESSION & REVOCATION ---');
  const token = await createAdminSessionToken(mockReq);
  const isValidBeforeLogout = await validateAdminSessionToken(token, mockReq);
  assert('Token é válido imediatamente após login', isValidBeforeLogout === true);

  await revokeAdminSessionToken(token);
  const isValidAfterLogout = await validateAdminSessionToken(token, mockReq);
  assert('Token antigo é REJEITADO (401/403) após logout (revogado no KV compartilhado)', isValidAfterLogout === false);

  // 2. Teste: Token Forjado / Assinatura Incorreta
  const forgedToken = `${token.split('.')[0]}.invalidSignature123456789`;
  const isForgedValid = await validateAdminSessionToken(forgedToken, mockReq);
  assert('Token com assinatura HMAC forjada é REJEITADO', isForgedValid === false);

  // 3. Teste: Brute Force Protection (Distributed Lockout)
  console.log('\n--- 2. DISTRIBUTED BRUTE FORCE ---');
  const attackerIp = '10.0.0.99';
  for (let i = 0; i < 5; i++) {
    await recordAdminLoginAttempt(attackerIp, false);
  }
  const rateLimitCheck = await checkAdminLoginRateLimit(attackerIp);
  assert('IP com 5 tentativas falhas consecutivas entra em LOCKOUT progressivo', rateLimitCheck.allowed === false);

  // 4. Teste: Fail-Closed Password Verification
  console.log('\n--- 3. FAIL-CLOSED & TIMING SAFETY ---');
  const isCorrectPass = verifyAdminPassword(process.env.ADMIN_PASSWORD || 'admin123456');
  const isWrongPass = verifyAdminPassword('wrong_password_attempt_999');
  assert('Senha correta é validada', isCorrectPass === true);
  assert('Senha errada é rejeitada', isWrongPass === false);

  // 5. Teste: Webhook HMAC Signature & Amount Matching
  console.log('\n--- 4. NEXUSPAG WEBHOOK INTEGRATION ---');
  process.env.NEXUSPAG_WEBHOOK_SECRET = 'secret_webhook_key_test_12345';
  const rawBody = JSON.stringify({ id: 'tx_123', amount: 9.90, status: 'paid' });
  const validSignature = crypto
    .createHmac('sha256', process.env.NEXUSPAG_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');

  const isWebhookValid = nexusPagService.verifyWebhookSignature(rawBody, validSignature);
  assert('Webhook com assinatura HMAC legítima é ACEITO', isWebhookValid === true);

  const isWebhookInvalid = nexusPagService.verifyWebhookSignature(rawBody, 'invalid_fake_signature');
  assert('Webhook sem assinatura ou assinatura inválida é REJEITADO (401)', isWebhookInvalid === false);

  // 6. Teste: Turnstile Replay Protection
  console.log('\n--- 5. TURNSTILE & ANTI-REPLAY ---');
  process.env.NODE_ENV = 'production';
  const missingTurnstile = await verifyTurnstileToken(undefined);
  assert('Produção com Turnstile ausente é REJEITADO', missingTurnstile.success === false);

  // 7. Teste: Mass Assignment & XSS URL Sanitization
  console.log('\n--- 6. MASS ASSIGNMENT & URL INJECTION ---');
  const dangerousConfig = {
    price: 9.90,
    maliciousField: 'exploit_payload',
    streamUrl: 'javascript:alert(1)',
    whatsappLink: 'https://wa.me/5511999999999',
  };
  const sanitized = sanitizeConfigUpdates(dangerousConfig);
  assert('Campo não permitido (maliciousField) é REMOVIDO via allowlist', sanitized.maliciousField === undefined);
  assert('URL maliciosa javascript: é BLOQUEADA e limpa', sanitized.streamUrl !== 'javascript:alert(1)');
  assert('URL legítima https:// é mantida', sanitized.whatsappLink === 'https://wa.me/5511999999999');

  // 8. Teste: Tracking Schema Validator
  console.log('\n--- 7. TRACKING SCHEMA VALIDATION ---');
  const validEvent = validateTrackEvent({ eventType: 'page_view', product: 'live_access' });
  const invalidEvent = validateTrackEvent({ eventType: 'DROP_DATABASE', product: 'admin' });
  assert('Evento de tracking legítimo é ACEITO', validEvent.isValid === true);
  assert('Evento malicioso fora da allowlist é REJEITADO', invalidEvent.isValid === false);

  console.log('\n========================================================');
  console.log(`📊 RESULTADO FINAL: ${passed} PASSADOS | ${failed} FALHOS`);
  console.log('========================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runSecuritySuite().catch((err) => {
  console.error('Test runner exception:', err);
  process.exit(1);
});
