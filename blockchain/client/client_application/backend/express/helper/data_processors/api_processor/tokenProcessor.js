"use strict";

class TokenProcessor {
  constructor() {
    this.refreshTokens = {};
  }

  storeRefreshToken(tokenData) {
    this.refreshTokens[tokenData.refreshToken] = tokenData;
  }

  removeRefreshToken(token) {
    delete this.refreshTokens[token];
  }

  validateRefreshToken(token) {
    return this.refreshTokens[token];
  }

  updateRefreshToken(tokenData) {
    this.refreshTokens[tokenData.refreshToken] = tokenData;
  }
}

module.exports = new TokenProcessor();
