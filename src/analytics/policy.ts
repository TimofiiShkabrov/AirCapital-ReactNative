export type Consent = 'unknown' | 'accepted' | 'declined';
export const CONSENT_KEY = 'aircapital.analytics.v1';
export const SCREENS = ['overview', 'exchanges', 'statistics', 'settings', 'account_details', 'flows', 'connection_guide'] as const;
export type Screen = typeof SCREENS[number];
export function screenForPath(path: string): Screen | undefined {
  if (path === '/') return 'overview';
  if (path === '/settings') return 'settings';
  if (path === '/flows') return 'flows';
  if (path === '/connect-guide') return 'connection_guide';
  if (/^\/details\/[^/]+$/.test(path)) return 'account_details';
}
export interface AnalyticsDriver {
  consent(enabled: boolean): Promise<void>;
  reset(): Promise<void>;
  screen(name: Screen): Promise<void>;
}
export function createAnalyticsPolicy(driver: AnalyticsDriver, storage: {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}) {
  let consent: Consent = 'unknown';
  let active = false;
  let current: Screen | undefined;
  let last: Screen | undefined;
  let generation = 0;
  let choiceGeneration = 0;
  let queue = Promise.resolve();
  const serial = <T>(task: () => Promise<T>): Promise<T> => {
    const next = queue.then(task);
    queue = next.then(() => {}, () => {});
    return next;
  };
  const screen = () => {
    const version = generation;
    return serial(async () => {
      if (version !== generation || consent !== 'accepted' || !active || !current || last === current) return;
      const name = current;
      await driver.screen(name);
      last = name;
    });
  };
  return {
    async hydrate(): Promise<Consent> {
      return serial(async () => {
        // Preserve accepted consent across launches (denial can reset SDK identifiers).
        // Native defaults are off for new installations; unreadable storage fails closed.
        consent = 'unknown';
        try {
          const saved = await storage.getItem(CONSENT_KEY);
          await driver.consent(saved === 'accepted');
          consent = saved === 'accepted' ? 'accepted' : saved === 'declined' ? 'declined' : 'unknown';
        } catch (error) {
          await driver.consent(false);
          throw error;
        }
        return consent;
      });
    },
    async choose(enabled: boolean): Promise<Consent> {
      ++generation;
      const version = ++choiceGeneration;
      consent = 'declined'; // Stop pending app events immediately, including during SDK awaits.
      last = undefined;
      await serial(async () => {
        await driver.consent(false);
        // Persist denial first: a failed enable must not silently grant on next launch.
        await storage.setItem(CONSENT_KEY, 'declined');
        if (!enabled) { consent = 'declined'; await driver.reset(); }
        else {
          await driver.consent(true);
          try { await storage.setItem(CONSENT_KEY, 'accepted'); }
          catch (error) { await driver.consent(false); throw error; }
          if (version === choiceGeneration) consent = 'accepted';
          else await driver.consent(false);
        }
      });
      await screen();
      return consent;
    },
    visibility(visible: boolean) {
      active = visible;
      if (!visible) { ++generation; last = undefined; }
      return screen();
    },
    screen(name: Screen) {
      if (!(SCREENS as readonly string[]).includes(name)) return Promise.resolve();
      current = name;
      return screen();
    },
  };
}
