import { createHash, createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  buildGateSignString,
  hmacSHA256Base64,
  hmacSHA256Hex,
  hmacSHA512Hex,
  sha512Hex,
} from './signing';

describe('signing helpers', () => {
  it('matches Node crypto for Binance/BingX HMAC-SHA256 hex signatures', () => {
    const message = 'symbol=BTCUSDT&timestamp=1710000000000';
    const secret = 'secret';

    expect(hmacSHA256Hex(message, secret)).toBe(createHmac('sha256', secret).update(message).digest('hex'));
  });

  it('matches Node crypto for OKX HMAC-SHA256 base64 signatures', () => {
    const message = '2024-04-28T12:00:00.000ZGET/api/v5/account/balance';
    const secret = 'okx-secret';

    expect(hmacSHA256Base64(message, secret)).toBe(createHmac('sha256', secret).update(message).digest('base64'));
  });

  it('matches Node crypto for Gate body hash and HMAC-SHA512 signatures', () => {
    const body = '{"currency_pair":"BTC_USDT"}';
    const signString = buildGateSignString('POST', '/api/v4/spot/orders', 'account=spot', body, '1710000000');

    expect(sha512Hex(body)).toBe(createHash('sha512').update(body).digest('hex'));
    expect(signString).toContain(sha512Hex(body));
    expect(hmacSHA512Hex(signString, 'gate-secret')).toBe(
      createHmac('sha512', 'gate-secret').update(signString).digest('hex'),
    );
  });
});
