// EAS build hook: fail before creating an unusable subscription binary.
const enabled = process.env.EXPO_PUBLIC_SUBSCRIPTIONS_ENABLED;
if (enabled && !["true", "false"].includes(enabled))
  throw new Error("EXPO_PUBLIC_SUBSCRIPTIONS_ENABLED must be true or false");
if (enabled === "true") {
  const platform = process.env.EAS_BUILD_PLATFORM;
  const platforms = platform === "ios" || platform === "android" ? [platform] : ["ios", "android"];
  for (const os of platforms) {
    const name = `EXPO_PUBLIC_REVENUECAT_${os.toUpperCase()}_KEY`;
    const prefix = os === "ios" ? "appl_" : "goog_";
    if (!new RegExp(`^${prefix}[A-Za-z0-9_]+$`).test(process.env[name] ?? ""))
      throw new Error(`${name} must contain the public SDK key for the real ${os} app. Never use a secret or Test Store key.`);
  }
}
console.log(`Subscription configuration: ${enabled === "true" ? "enabled; public key format checked" : "disabled"}.`);
