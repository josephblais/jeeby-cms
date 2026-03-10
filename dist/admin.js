'use strict';

// src/admin/index.js
function AdminPanel() {
  return null;
}
function withCMSAuth() {
  return function middleware(_req, _res, next) {
    if (next) next();
  };
}

exports.AdminPanel = AdminPanel;
exports.withCMSAuth = withCMSAuth;
