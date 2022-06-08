const crypto = require("crypto");
const crypto_algorithm = "aes-192-cbc";
const { PrivateKey } = require("@fidm/x509");

exports.signData = (data, privKeyPem) => {
  const privateKey = PrivateKey.fromPEM(privKeyPem);
  data = Buffer.from(data);
  return privateKey.sign(data, "sha256");
};
