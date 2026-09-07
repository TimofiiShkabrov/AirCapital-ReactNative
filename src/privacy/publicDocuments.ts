import operator from "../web/legal/operator.json";

export const publicLegalReady = operator.verified && !!operator.name.trim() && !!operator.country.trim() && !!operator.address.trim();
export const PRIVACY_URL = "https://aircapital.app/privacy";
export const TERMS_URL = "https://aircapital.app/terms";
export const DELETION_URL = "https://aircapital.app/data-deletion";
