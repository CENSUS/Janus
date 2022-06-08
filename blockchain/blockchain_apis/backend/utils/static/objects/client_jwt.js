class ClientJWT {
  constructor(
    issuerCN,
    issuerOrganization,
    subjectCN,
    subjectOU
  ) {
    if (arguments.length < 4) throw new Error(`Malformed Client JWT`);

    this.jwtInfo = {
      issuerCN,
      issuerOrganization,
      subjectCN,
      subjectOU,
    };
  }

  get getJWTInfo() {
    return this.jwtInfo;
  }

  signJWT() {
    const signedClientJWT = require("./../../crypto/jwt.js").jwtSign(this.getJWTInfo);
    return signedClientJWT;
  }
}

module.exports = ClientJWT;
