import { describe, expect, it, vi } from 'vitest';
import { CONSENT_KEY, createAnalyticsPolicy, screenForPath } from './policy';
function fixture(saved: string | null = null) {
  const driver = { consent: vi.fn(async (_enabled: boolean) => {}), reset: vi.fn(async () => {}), screen: vi.fn(async (_name: string) => {}) };
  const storage = { getItem: vi.fn(async () => saved), setItem: vi.fn(async (_key: string, _value: string) => {}) };
  return { driver, storage, policy: createAnalyticsPolicy(driver, storage) };
}
describe('native analytics privacy', () => {
  it('does not send screens before explicit consent or replay historical screens', async () => {
    const { policy, driver } = fixture();
    expect(await policy.hydrate()).toBe('unknown');
    await policy.visibility(true); await policy.screen('settings'); await policy.screen('overview');
    expect(driver.screen).not.toHaveBeenCalled();
    await policy.choose(true);
    expect(driver.screen.mock.calls).toEqual([['overview']]);
  });
  it('restores only the exact accepted preference and fails closed on unreadable storage', async () => {
    const f = fixture('true'); await f.policy.hydrate(); expect(f.driver.consent.mock.calls).toEqual([[false]]);
    f.storage.getItem.mockRejectedValueOnce(new Error('storage'));
    await expect(f.policy.hydrate()).rejects.toThrow(); expect(f.driver.consent).toHaveBeenLastCalledWith(false);
    const accepted = fixture('accepted'); expect(await accepted.policy.hydrate()).toBe('accepted');
    expect(accepted.driver.consent.mock.calls).toEqual([[true]]);
  });
  it('stops queued events immediately on revocation and resets the instance', async () => {
    const { policy, driver } = fixture('accepted'); await policy.hydrate(); await policy.visibility(true);
    const pending = policy.screen('settings'); const revoke = policy.choose(false);
    await Promise.all([pending, revoke]);
    expect(driver.screen).not.toHaveBeenCalled(); expect(driver.reset).toHaveBeenCalledOnce();
    await policy.screen('overview'); expect(driver.screen).not.toHaveBeenCalled();
  });
  it('suppresses duplicate screens and screens behind the lock/background cover', async () => {
    const { policy, driver } = fixture('accepted'); await policy.hydrate();
    await policy.screen('overview'); expect(driver.screen).not.toHaveBeenCalled();
    await policy.visibility(true); await policy.screen('overview');
    expect(driver.screen).toHaveBeenCalledTimes(1);
    await policy.visibility(false); await policy.screen('settings');
    expect(driver.screen).toHaveBeenCalledTimes(1);
    await policy.visibility(true); expect(driver.screen).toHaveBeenLastCalledWith('settings');
  });
  it('disables the SDK if persisting acceptance fails', async () => {
    const { policy, driver, storage } = fixture(); await policy.hydrate();
    storage.setItem.mockImplementation(async (_key, value) => { if (value === 'accepted') throw new Error('disk'); });
    await expect(policy.choose(true)).rejects.toThrow('disk');
    expect(storage.setItem).toHaveBeenCalledWith(CONSENT_KEY, 'declined');
    expect(driver.consent).toHaveBeenLastCalledWith(false);
    await policy.visibility(true); await policy.screen('overview'); expect(driver.screen).not.toHaveBeenCalled();
  });
  it('never sends arbitrary routes, account IDs or input', async () => {
    expect(screenForPath('/details/private-exchange-account')).toBe('account_details');
    expect(screenForPath('/unrecognised?apiKey=secret')).toBeUndefined();
    const { policy, driver } = fixture('accepted'); await policy.hydrate(); await policy.visibility(true);
    await policy.screen('secret' as 'overview'); expect(driver.screen).not.toHaveBeenCalled();
  });
  it('a delete-all revocation supersedes an in-flight enable', async () => {
    const { policy, driver, storage } = fixture(); await policy.hydrate();
    let release!: () => void;
    const pending = new Promise<void>(resolve => { release = resolve; });
    driver.consent.mockImplementation(async enabled => { if (enabled) await pending; });
    const enabling = policy.choose(true);
    const revoking = policy.choose(false);
    release();
    await Promise.all([enabling, revoking]);
    expect(driver.consent).toHaveBeenLastCalledWith(false);
    expect(storage.setItem).toHaveBeenLastCalledWith(CONSENT_KEY, 'declined');
    await policy.visibility(true); await policy.screen('overview');
    expect(driver.screen).not.toHaveBeenCalled();
  });

});
