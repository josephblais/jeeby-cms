// src/admin/index.js
function AdminPanel() {
  return null;
}
function withCMSAuth() {
  return function middleware(_req, _res, next) {
    if (next) next();
  };
}

export { AdminPanel, withCMSAuth };
