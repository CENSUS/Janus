"use strict";

const router = require("express").Router();
router.use("/v1", require("./v1"));

router.get("/", async function (req, res, next) {
    res.sendFile("index.html", { root: "." });
});

module.exports = router;
