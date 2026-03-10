'use strict';

// src/index.js
function CMSProvider({ children }) {
  return children ?? null;
}
function Blocks() {
  return null;
}
function Block() {
  return null;
}
function useCMSContent() {
  return null;
}

exports.Block = Block;
exports.Blocks = Blocks;
exports.CMSProvider = CMSProvider;
exports.useCMSContent = useCMSContent;
