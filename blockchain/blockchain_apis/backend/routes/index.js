const {
  metrics: { metricsOn, pageLog },
} = require("./../config/main_config");
const roundTo = require("round-to");
const statsManager =
  metricsOn && require("./../management/statistics/stats_manager");

const {
  countZerosOfDecimal,
  matchStrings,
} = require("../utils/processors/various");
const { GeneralError } = require("../middlewares/utils/error_types");
const path = require("path");

const router = require("express").Router();

router.use("/v1", require("./v1"));

router.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "/../react/build/index.html"));
});

module.exports = router;
