const router = require("express").Router();

const { GeneralError } = require("../../middlewares/utils/error_types.js");
const {
  metrics: { metricsOn, pageLog },
} = require("./../../config/main_config");
const {
  countZerosOfDecimal,
  matchStrings,
  jsonParser,
} = require("../../utils/processors/various.js");
const roundTo = require("round-to");
const statsManager =
  metricsOn && require("./../../management/statistics/stats_manager");

router.get("/availability", async function (req, res, next) {
  if (metricsOn && pageLog) {
    res.status(200).send(true);
  } else {
    res.status(500).send(false);
  }
});

router.get("/available-benchmarks", async function (req, res, next) {
  if (metricsOn && !pageLog) {
    const generalErrorMsg = new GeneralError("Not available function");
    res.status(generalErrorMsg.getCode(400)).send(generalErrorMsg.message);
    return;
  }

  const benchmarksHistory = statsManager.getBenchmarksHistory;

  const benchmarks = benchmarksHistory.map((item) => {
    const benchmarkTimestamp = item.timeOfReset;
    return benchmarkTimestamp;
  });

  res.status(200).send(benchmarks);
});

router.get("/get-benchmark-data", async function (req, res, next) {
  if (metricsOn && !pageLog) {
    const generalErrorMsg = new GeneralError("Not available function");
    res.status(generalErrorMsg.getCode(400)).send(generalErrorMsg.message);
    return;
  }

  const {
    query: { timestamp },
  } = req;

  let stats;
  if (timestamp && !matchStrings(timestamp, "LIVE")) {
    stats = jsonParser(
      statsManager.getDistinctBenchmark(timestamp)["TOTAL_TIME_SUBMITS"]
    )["VALUES_TO_PRINT"];
  } else {
    stats = statsManager.getStatsToPrint;
  }

  Object.entries(stats).forEach(([key, value]) => {
    if (matchStrings(key, "SAMPLES_NR")) return;
    const decimalNumber = countZerosOfDecimal(value);

    if (decimalNumber >= 2) {
      stats[key] = roundTo(value, decimalNumber + 2) || value;
    } else {
      stats[key] = roundTo(value, 2) || value;
    }
  });

  res.status(200).send({
    hasRequestsToDisplay: stats.SAMPLES_NR > 0,
    benchmarkInfo: stats,
  });
});

router.get("/reset-stats", async function (req, res, next) {
  const resetSuccess = statsManager.startNewStats();

  if (resetSuccess) {
    res.status(200).send({ message: true });
  } else {
    res.status(200).send({ message: false });
  }
});

router.get("/benchmarks-history", async function (req, res, next) {
  if (metricsOn && !pageLog) {
    const generalErrorMsg = new GeneralError("Not available function");
    res.status(generalErrorMsg.getCode(400)).send(generalErrorMsg.message);
    return;
  }

  const benchmarksHistory = statsManager.getBenchmarksHistory;

  const history = benchmarksHistory.map((item) => {
    const { TOTAL_TIME_SUBMITS } = item;

    const data = jsonParser(TOTAL_TIME_SUBMITS);

    const SAMPLES_NR = data["REQUESTS_NR"];
    let DATA_TO_PRINT = data["VALUES_TO_PRINT"];

    Object.entries(DATA_TO_PRINT).forEach(([key, value]) => {
      if (matchStrings(key, "SAMPLES_NR")) return;
      const decimalNumber = countZerosOfDecimal(value);

      if (decimalNumber >= 2) {
        DATA_TO_PRINT[key] = roundTo(value, decimalNumber + 2) || value;
      } else {
        DATA_TO_PRINT[key] = roundTo(value, 2) || value;
      }
    });

    return { SAMPLES_NR, benchmarkInfo: DATA_TO_PRINT };
  });

  res.status(200).send({
    history,
  });
});

module.exports = router;
