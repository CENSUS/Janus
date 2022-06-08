"use strict";
const hrtime = process.hrtime;
const NS_PER_SEC = 1e9;
const {
  metrics: { metricsOn, cliLog },
} = require("../../config/main_config.js");
const styles = require("../../config/styles.js");

const INITIAL_VALUES = {
  SUBMIT_TIMERS: {},
  EVALUATION_TIMERS: {},
  REQUESTIDS: {},
  TOTAL_TIME_SUBMITS: {
    REQUESTS_NR: 0,
    DISTINCT_VALUES: { TICKETING: 0, ENDORSE: 0, COMMIT: 0, BC_RTT: 0 },
    AGGREGATED_VALUES: [],
    AGGREGATED_VALUES_TOTAL: 0,
    AVERAGE: 0,
    STD_DEV: 0,
    VALUES_TO_PRINT: {},
    MIN: 0,
    MAX: 0,
  },
};

class StatsManager {
  constructor() {
    this.startNewStats(true);

    this.history = [];
    this.systemIsActive = false;

    this.#superviseStats();
  }

  get getStatsToPrint() {
    return this.TOTAL_TIME_SUBMITS.VALUES_TO_PRINT;
  }

  get getBenchmarksHistory() {
    return this.history;
  }

  getDistinctBenchmark(timestamp) {
    return (
      this.history.filter((item) => item.timeOfReset == timestamp)[0] || {}
    );
  }

  #superviseStats() {
    if (Object.keys(this.REQUESTIDS).length == 0 && this.systemIsActive) {
      console.log(
        styles.CYAN,
        "It seems that there are no more active requests - Starting a new Stats-Manager session"
      );

      this.startNewStats();
      this.systemIsActive = false;
    }

    setTimeout(this.#superviseStats.bind(this), 1000);
  }

  startNewStats(setOnlyState = false) {
    if (
      !setOnlyState &&
      (this.TOTAL_TIME_SUBMITS && this.TOTAL_TIME_SUBMITS.REQUESTS_NR) == 0
    ) {
      return false;
    }

    if (
      setOnlyState ||
      (this.REQUESTIDS && Object.keys(this.REQUESTIDS).length == 0)
    ) {
      const crucialKeys = [
        "SUBMIT_TIMERS",
        "EVALUATION_TIMERS",
        "REQUESTIDS",
        "TOTAL_TIME_SUBMITS",
      ];

      if (!setOnlyState) {
        const currentIndex =
          this.history.push({ timeOfReset: new Date().getTime() }) - 1;

        crucialKeys
          .filter((key) => key !== "REQUESTIDS")
          .forEach(
            (key) =>
              (this.history[currentIndex][key] = JSON.stringify(this[key]))
          );
      }

      crucialKeys.forEach((key) => {
        this[key] = JSON.parse(JSON.stringify(INITIAL_VALUES[key]));
      });

      return true;
    } else {
      return false;
    }
  }

  combineRequestIDWithTicketID(requestID, ticketID) {
    if (Object.keys(this.REQUESTIDS).length == 0) this.systemIsActive = true;
    this.REQUESTIDS[requestID] = ticketID;
  }

  completeBCActionRTT(requestID) {
    const ticketID = this.REQUESTIDS[requestID];
    this.#removeRequestID(requestID);

    const timer = this.SUBMIT_TIMERS[ticketID];

    timer["BCActionRTT"].END = hrtime();

    const START_TIME = timer["BCActionRTT"].START;
    const END_TIME = timer["BCActionRTT"].END;

    const final =
      (END_TIME[0] - START_TIME[0]) * NS_PER_SEC +
      (END_TIME[1] - START_TIME[1]);

    timer["BCActionRTT"].TOTAL_BC_RTT = final;

    timer.isCompleted = true;

    this.#updateCompleted(timer);
  }

  #updateCompleted(timer) {
    let aggr_total = 0;
    this.TOTAL_TIME_SUBMITS["REQUESTS_NR"]++;

    this.TOTAL_TIME_SUBMITS["DISTINCT_VALUES"]["TICKETING"] += timer.TICKETING;

    this.TOTAL_TIME_SUBMITS["DISTINCT_VALUES"]["ENDORSE"] += timer.ENDORSE;

    this.TOTAL_TIME_SUBMITS["DISTINCT_VALUES"]["COMMIT"] += timer.COMMIT;

    this.TOTAL_TIME_SUBMITS["DISTINCT_VALUES"]["BC_RTT"] +=
      timer["BCActionRTT"].TOTAL_BC_RTT;

    aggr_total =
      timer.TICKETING +
      timer.ENDORSE +
      timer.COMMIT +
      timer["BCActionRTT"].TOTAL_BC_RTT;

    this.TOTAL_TIME_SUBMITS.AGGREGATED_VALUES.push(aggr_total);
    this.TOTAL_TIME_SUBMITS.AGGREGATED_VALUES_TOTAL += aggr_total;

    this.#calculateBenchmarkValues();

    cliLog && console.table(this.TOTAL_TIME_SUBMITS.VALUES_TO_PRINT);
  }

  #calculateBenchmarkValues() {
    this.TOTAL_TIME_SUBMITS["AVERAGE"] =
      this.TOTAL_TIME_SUBMITS.AGGREGATED_VALUES_TOTAL /
      this.TOTAL_TIME_SUBMITS.REQUESTS_NR;

    this.TOTAL_TIME_SUBMITS.VALUES_TO_PRINT["AVERAGE"] =
      this.TOTAL_TIME_SUBMITS.AVERAGE / NS_PER_SEC;

    this.TOTAL_TIME_SUBMITS.VALUES_TO_PRINT["SAMPLES_NR"] =
      this.TOTAL_TIME_SUBMITS.REQUESTS_NR;

    this.#calculateDistinctMedian("TICKETING");
    this.#calculateDistinctMedian("ENDORSE");
    this.#calculateDistinctMedian("COMMIT");
    this.#calculateDistinctMedian("BC_RTT");

    this.#calculateStdDev();

    this.#defineMinAndMax();
  }

  #calculateDistinctMedian(type) {
    this.TOTAL_TIME_SUBMITS.VALUES_TO_PRINT[type] =
      this.TOTAL_TIME_SUBMITS["DISTINCT_VALUES"][type] /
      this.TOTAL_TIME_SUBMITS.REQUESTS_NR /
      NS_PER_SEC;
  }

  #calculateStdDev() {
    // Step 1. Calculate the Mean (Average) - Already calculated (TOTAL_TIME_SUBMITS["AVERAGE"])
    // Step 2. For each number, substract the mean and square the result
    // Step 3. Add all the numbers from step 2. and divide by the total Nr. of requests
    // Step 4. Take the square root of the result

    const step2Nrs = this.TOTAL_TIME_SUBMITS["AGGREGATED_VALUES"].map((val) =>
      Math.pow(val - this.TOTAL_TIME_SUBMITS.AVERAGE, 2)
    );

    const step3Nr =
      step2Nrs.reduce((a, b) => a + b, 0) / this.TOTAL_TIME_SUBMITS.REQUESTS_NR;

    const step4Nr = Math.sqrt(step3Nr);

    this.TOTAL_TIME_SUBMITS.STD_DEV = step4Nr;

    this.TOTAL_TIME_SUBMITS.VALUES_TO_PRINT["STD_DEV"] = step4Nr;
  }

  #defineMinAndMax() {
    this.TOTAL_TIME_SUBMITS.MIN =
      this.TOTAL_TIME_SUBMITS.AGGREGATED_VALUES.reduce((prev, next) =>
        prev > next ? next : prev
      ) / NS_PER_SEC;
    this.TOTAL_TIME_SUBMITS.MAX =
      this.TOTAL_TIME_SUBMITS.AGGREGATED_VALUES.reduce((prev, next) =>
        prev < next ? next : prev
      ) / NS_PER_SEC;

    this.TOTAL_TIME_SUBMITS.VALUES_TO_PRINT["MIN_VALUE"] =
      this.TOTAL_TIME_SUBMITS.MIN;

    this.TOTAL_TIME_SUBMITS.VALUES_TO_PRINT["MAX_VALUE"] =
      this.TOTAL_TIME_SUBMITS.MAX;
  }

  #removeRequestID(requestID) {
    delete this.REQUESTIDS[requestID];
  }

  ticketTimers() {
    const startTimer = function (req, res, next) {
      if (!metricsOn) {
        next();
        return;
      }

      res.locals.timers = {};
      res.locals.timers.ticketStart = hrtime();
      next();
    }.bind(this);

    const endTimer = function (req, res, next) {
      if (!metricsOn) {
        next();
        return;
      }

      res.locals.timers.ticketReady = hrtime(res.locals.timers.ticketStart);

      const { ticketID, shouldCommit } = res.locals.ticket;

      switch (shouldCommit) {
        case true: {
          this.SUBMIT_TIMERS[ticketID] = {};
          this.SUBMIT_TIMERS[ticketID].TICKETING =
            res.locals.timers.ticketReady[0] * NS_PER_SEC +
            res.locals.timers.ticketReady[1];
        }
        case false: {
          this.EVALUATION_TIMERS[ticketID] = {};
          this.EVALUATION_TIMERS[ticketID].TICKETING =
            res.locals.timers.ticketReady[0] * NS_PER_SEC +
            res.locals.timers.ticketReady[1];
          break;
        }
      }

      next();
    }.bind(this);

    return { startTimer, endTimer };
  }

  bcCommunicationTimers() {
    const startTimer = function (req, res, next) {
      if (!metricsOn) {
        next();
        return;
      }

      res.locals.timers = {};
      res.locals.timers.communicationStart = hrtime();
      next();
    }.bind(this);

    const endTimer = function (req, res, next) {
      if (!metricsOn) {
        next();
        return;
      }

      const { ticketID, shouldCommit } = res.locals.ticket;
      const { actionToCall } = res.locals;

      const communicationEnd = hrtime(res.locals.timers.communicationStart);

      switch (shouldCommit) {
        case true: {
          const timer = this.SUBMIT_TIMERS[ticketID];

          timer[actionToCall] =
            communicationEnd[0] * NS_PER_SEC + communicationEnd[1];

          if (actionToCall === "COMMIT") {
            timer["BCActionRTT"] = {};
            timer["BCActionRTT"].START = hrtime();
          }

          break;
        }
        case false: {
          const timer = this.EVALUATION_TIMERS[ticketID];
          timer.BC_COMMUNICATION =
            communicationEnd[0] * NS_PER_SEC + communicationEnd[1];

          timer.totalTime = timer.TICKETING + timer.BC_COMMUNICATION;
          break;
        }
      }
    }.bind(this);

    return { startTimer, endTimer };
  }
}

module.exports = new StatsManager();
