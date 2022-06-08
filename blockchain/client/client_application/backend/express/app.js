require("dotenv").config({ path: __dirname + "/.env" });

const http = require("http");
const cors = require("cors");
const errorHandler = require("./middlewares/errorHandler");
const config = require("./config");
const express = require("express");

const corsOptions = {
  origin: "http://localhost:3000",
  credentials: true,
  optionSuccessStatus: 200,
};

class Server {
  start() {
    const app = express();
    app.enable("trust proxy");
    app.use(cors(corsOptions));

    app.use(express.json({ extended: false, limit: "50mb" }));
    app.use(express.urlencoded({ extended: false, limit: "50mb" }));

    app.use(require("method-override")());
    app.use(config.baseUrl, require("./routes"));

    app.use(errorHandler);

    // const httpsServer = https.createServer(config.tlsOptions, app);

    const httpServer = http.createServer(app);

    httpServer.listen(config.serverPort, () => {
      console.log(
        `\n Application is up and running (Electron Backend) - Port: ${config.serverPort} `
      );
    });

    process.on("uncaughtException", function (exception) {
      console.log(exception);
    });
  }
}

module.exports = new Server();
