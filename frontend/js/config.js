/**
 * Configuration for NEMTHUNG Frontend
 */
export const BASE_URL = (window.__ENV__ && window.__ENV__.API_BASE) || 'http://localhost/btl-db/backend';

window.ENV = {
  API_URL: "http://localhost/btl-db/backend",
  API_TIMEOUT: 10000, // 10 seconds
  ENABLE_CACHE: true,
  DEBUG_MODE: true
};
