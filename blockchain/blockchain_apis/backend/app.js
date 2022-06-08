require("dotenv").config();

const https = require("https");
const cors = require("cors");
const express = require("express");
const errorHandler = require("./middlewares/errorHandler");
const path = require("path");

const BlockchainManager = require("./management/blockchain_manager.js");

// Config
const config = require("./config/main_config");

function server() {
  const app = express();
  app.use(cors());

  app.use(express.static(path.join(__dirname, "react", "build")));
  app.use(express.static("public"));
  // app.use((req, res, next) => {
  //   res.sendFile(path.join(__dirname, "react", "build", "index.html"));
  // });

  app.options(
    "*",
    cors({
      origin: false,
      //optionsSuccessStatus: 200,
      // credentials: true,
    })
  );

  app.use(express.json({ extended: false, limit: "50mb" }));
  app.use(
    express.urlencoded({
      limit: "50mb",
      extended: false,
    })
  );

  app.use(config.baseUrl, require("./routes"));

  app.use(errorHandler);

  const httpsServer = https.createServer(config.tlsOptions, app);

  httpsServer.listen(config.serverPort, () => {
    console.log(
      `\n---------------- Server is running on port ${config.serverPort} and can communicate with the Proxy Blockchain ----------------`
    );
  });

  process.on("uncaughtException", function (exception) {
    console.log(exception);
  });
}

BlockchainManager.initialize().then(() => server());
