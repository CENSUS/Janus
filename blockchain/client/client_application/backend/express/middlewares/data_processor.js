"use strict";

const base64Regex =
  /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;

// The route accepts a base64 payload - We need to decode it to utf8, then check if the base64's contents correspond to an Identity (this will be checked by a validator)
exports.fromBase64Decoder = (req, res, next) => {
  const { payload } = req.body;
  const buf = Buffer.from(payload, "base64").toString("utf-8");
  const parsed_buf = JSON.parse(buf);
  req.body = parsed_buf;

  if (req.body.identity) {
    // If an identity exists (more probably, it will), transform it from BASE64 to UTF8
    const { identity } = req.body;
    const isBase64Identity = base64Regex.test(identity);
    if (isBase64Identity) {
      const buf = Buffer.from(identity, "base64").toString("utf-8");
      const parsed_buf = JSON.parse(buf);
      req.body.identity = parsed_buf;
    }
  }
  next();
};
