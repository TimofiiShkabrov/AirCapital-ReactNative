import { createStore } from "zustand/vanilla";

type AppVisibility =
  "active" | "inactive" | "background" | "unknown" | "extension";
type Authenticate = () => Promise<{ success: boolean }>;

/** Memory only: a process restart always starts locked. Shared with lock settings. */
export function createPrivacySession() {
  const store = createStore(() => ({
    appState: "unknown" as AppVisibility,
    ready: false,
    enabled: false,
    unlocked: false,
    busy: false,
    attempted: false,
    failed: false,
  }));
  let inFlight: Promise<boolean> | undefined;
  const waitForForeground = () => {
    if (store.getState().appState !== "background") return Promise.resolve();
    // Android can resolve its credential Activity just before sending resume.
    // Keep the cover and request busy during that short event-ordering gap.
    return new Promise<void>((resolve) => {
      const finish = () => {
        clearTimeout(timer);
        unsubscribe();
        resolve();
      };
      const unsubscribe = store.subscribe((state) => {
        if (state.appState === "active") finish();
      });
      const timer = setTimeout(finish, 500);
    });
  };
  const authenticate = (prompt: Authenticate): Promise<boolean> => {
    if (inFlight) return inFlight;
    if (store.getState().appState !== "active") return Promise.resolve(false);
    store.setState({ busy: true, attempted: true, failed: false });
    inFlight = Promise.resolve()
      .then(prompt)
      .then(
        (result) => result.success,
        () => false,
      )
      .then(async (success) => {
        await waitForForeground();
        const state = store.getState();
        // A system prompt may temporarily make iOS inactive. A background result
        // must never unlock the next foreground session.
        const foreground =
          state.appState === "active" || state.appState === "inactive";
        store.setState({
          unlocked: foreground && (success || state.unlocked),
          failed: foreground && !success,
          attempted: foreground,
        });
        return foreground && success;
      })
      .finally(() => {
        inFlight = undefined;
        store.setState({ busy: false });
      });
    return inFlight;
  };
  return {
    store,
    configure(ready: boolean, enabled: boolean) {
      const state = store.getState();
      if (state.ready === ready && state.enabled === enabled) return;
      store.setState({ ready, enabled });
    },
    setAppState(appState: AppVisibility) {
      const state = store.getState();
      if (state.appState === appState) return;
      store.setState({
        appState,
        ...(appState === "background"
          ? { unlocked: false, attempted: false, failed: false }
          : {}),
      });
    },
    authenticate,
    autoUnlock(prompt: Authenticate) {
      const state = store.getState();
      if (
        state.ready &&
        state.enabled &&
        !state.unlocked &&
        !state.attempted &&
        !state.busy &&
        state.appState === "active"
      )
        return authenticate(prompt);
      return Promise.resolve(false);
    },
  };
}

export const privacySession = createPrivacySession();
