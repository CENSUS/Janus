const { Certificate, PrivateKey } = require("@fidm/x509");

exports.signData = (data, privKeyPem) => {
  const privateKey = PrivateKey.fromPEM(privKeyPem);
  data = Buffer.from(data);
  const signature = privateKey.sign(data, "sha256");

  return signature;
};

exports.verifySignature = (certificate, data, signature) => {
  const cert = Certificate.fromPEM(certificate);
  const verified = cert.publicKey.verify(data, signature, "sha256");

  return verified;
};
