import { describe, expect, it, vi } from "vitest";
import { createPrivacySession } from "./privacySession";

function setup() {
  const session = createPrivacySession();
  const prompt = vi.fn(async () => ({ success: true }));
  session.setAppState("active");
  return { session, prompt };
}

describe("biometric session lifecycle", () => {
  it("automatically prompts on cold start only after preferences load", async () => {
    const { session, prompt } = setup();
    await session.autoUnlock(prompt);
    expect(prompt).not.toHaveBeenCalled();
    session.configure(true, true);
    await session.autoUnlock(prompt);
    expect(session.store.getState().unlocked).toBe(true);
    expect(prompt).toHaveBeenCalledTimes(1);
    expect(createPrivacySession().store.getState().unlocked).toBe(false);
  });
  it("does not authenticate when protection is disabled", async () => {
    const { session, prompt } = setup();
    session.configure(true, false);
    await session.autoUnlock(prompt);
    session.setAppState("background");
    session.setAppState("active");
    await session.autoUnlock(prompt);
    expect(prompt).not.toHaveBeenCalled();
  });
  it("keeps a session unlocked through navigation and temporary inactive events", async () => {
    const { session, prompt } = setup();
    session.configure(true, true);
    await session.autoUnlock(prompt);
    for (const state of ["active", "inactive", "active", "active"] as const) {
      session.setAppState(state);
      await session.autoUnlock(prompt);
    }
    expect(prompt).toHaveBeenCalledTimes(1);
    expect(session.store.getState().unlocked).toBe(true);
  });
  it("locks on background and automatically authenticates once on return", async () => {
    const { session, prompt } = setup();
    session.configure(true, true);
    await session.autoUnlock(prompt);
    session.setAppState("background");
    expect(session.store.getState().unlocked).toBe(false);
    await session.autoUnlock(prompt);
    expect(prompt).toHaveBeenCalledTimes(1);
    session.setAppState("inactive");
    await session.autoUnlock(prompt);
    session.setAppState("active");
    await session.autoUnlock(prompt);
    await session.autoUnlock(prompt);
    expect(prompt).toHaveBeenCalledTimes(2);
  });
  it("does not loop after cancellation; manual retry or the next entry can unlock", async () => {
    const { session, prompt } = setup();
    prompt.mockResolvedValueOnce({ success: false });
    session.configure(true, true);
    await session.autoUnlock(prompt);
    session.setAppState("inactive");
    session.setAppState("active");
    await session.autoUnlock(prompt);
    expect(prompt).toHaveBeenCalledTimes(1);
    expect(session.store.getState()).toMatchObject({
      unlocked: false,
      failed: true,
      busy: false,
    });
    await session.authenticate(prompt);
    expect(session.store.getState()).toMatchObject({
      unlocked: true,
      failed: false,
    });
  });
  it("shares settings authentication so enabling protection needs only one prompt", async () => {
    const { session, prompt } = setup();
    session.configure(true, false);
    expect(await session.authenticate(prompt)).toBe(true);
    session.configure(true, true);
    await session.autoUnlock(prompt);
    expect(prompt).toHaveBeenCalledTimes(1);
    expect(session.store.getState().unlocked).toBe(true);
  });
  it("deduplicates simultaneous automatic and manual requests, including iOS prompt inactivity", async () => {
    const { session, prompt } = setup();
    session.configure(true, true);
    prompt.mockImplementation(async () => {
      session.setAppState("inactive");
      return { success: true };
    });
    await Promise.all([
      session.autoUnlock(prompt),
      session.authenticate(prompt),
      session.autoUnlock(prompt),
    ]);
    session.setAppState("active");
    await session.autoUnlock(prompt);
    expect(prompt).toHaveBeenCalledTimes(1);
    expect(session.store.getState().unlocked).toBe(true);
  });
  it("ignores successful results delivered in background and asks again on return", async () => {
    const { session, prompt } = setup();
    session.configure(true, true);
    prompt.mockImplementationOnce(async () => {
      session.setAppState("background");
      return { success: true };
    });
    expect(await session.autoUnlock(prompt)).toBe(false);
    expect(session.store.getState().unlocked).toBe(false);
    session.setAppState("active");
    await session.autoUnlock(prompt);
    expect(prompt).toHaveBeenCalledTimes(2);
  });
  it("does not re-prompt after a cancelled Android credential activity returns", async () => {
    const { session, prompt } = setup();
    session.configure(true, true);
    prompt.mockImplementationOnce(async () => {
      session.setAppState("background");
      session.setAppState("active");
      await session.autoUnlock(prompt);
      return { success: false };
    });
    await session.autoUnlock(prompt);
    await session.autoUnlock(prompt);
    expect(prompt).toHaveBeenCalledTimes(1);
    expect(session.store.getState().unlocked).toBe(false);
  });
  it.each([true, false])(
    "waits for Android resume when credential result %s arrives first",
    async (success) => {
      vi.useFakeTimers();
      const { session, prompt } = setup();
      session.configure(true, true);
      prompt.mockImplementationOnce(async () => {
        session.setAppState("background");
        setTimeout(() => session.setAppState("active"), 50);
        return { success };
      });
      const result = session.autoUnlock(prompt);
      await vi.advanceTimersByTimeAsync(100);
      expect(await result).toBe(success);
      await session.autoUnlock(prompt);
      expect(prompt).toHaveBeenCalledTimes(1);
      expect(session.store.getState().unlocked).toBe(success);
    },
  );
  it("releases the busy state after a native error without auto-retry loops", async () => {
    const { session, prompt } = setup();
    session.configure(true, true);
    prompt.mockRejectedValueOnce(new Error("native error"));
    await session.autoUnlock(prompt);
    await session.autoUnlock(prompt);
    expect(session.store.getState()).toMatchObject({
      unlocked: false,
      busy: false,
      failed: true,
    });
    session.setAppState("background");
    session.setAppState("active");
    await session.autoUnlock(prompt);
    expect(session.store.getState().unlocked).toBe(true);
  });
});
