"use strict";
require("dotenv").config();

const { updateMSPElections } = require("./helper/data_processors/initializers");
const WAIT_BEFORE_TERMINATION = 5;
const blockchain_manager = require("./utilities/blockchain_manager.js");
const queue_supervisor = require("./utilities/modules/queue_supervisor");

blockchain_manager
  .initialize()
  .then(() => blockchain_manager.initializeQueues())
  .then(() => updateMSPElections())
  .then(() => queue_supervisor.startSupervisor());

process.on("SIGTERM", () => {
  console.log("Terminating the server...");

  setTimeout(() => {
    server.close(() => {
      console.log("Server terminated");
      process.exit(0);
    });
  }, WAIT_BEFORE_TERMINATION * 1000);
});
