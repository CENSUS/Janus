const debug = require("debug");
const Electron = require("electron");
const path = require("path");
const App = require("./../express/app.js");
const isDev = require("electron-is-dev");

class Main {
  constructor(app, browserWindow) {
    Main.BrowserWindow = browserWindow;
    Main.application = app;
    Main.application.on("window-all-closed", Main.onWindowAllClosed);
    Main.application.on("ready", Main.onReady);
    Main.application.on("activate", Main.onActivate);
    Main.quitOnCloseOSX = true;

    App.start();
  }

  static onReady() {
    // Development Mode
    if (isDev) {
      try {
        require("electron-reloader")(module);
      } catch (_) {}

      const {
        default: installExtension,
        REACT_DEVELOPER_TOOLS,
        REDUX_DEVTOOLS,
      } = require("electron-devtools-installer");
      // Extensions
      installExtension([REACT_DEVELOPER_TOOLS, REDUX_DEVTOOLS]).catch((err) =>
        console.log("An error occurred: ", err)
      );
    }

    Main.mainWindow = new Main.BrowserWindow({
      width: 1280,
      height: 1024,
      webPreferences: {
        nodeIntegration: false,
        worldSafeExecuteJavaScript: true,
        contextIsolation: true,
        preload: path.join(__dirname, "preload.js"),
      },
    });

    const startUrl =
      process.env.ELECTRON_START_URL ||
      `file://${path.join(__dirname, "./../client/index.html")}`;
    Main.mainWindow.loadURL(startUrl);

    // If Development Mode is active
    if (isDev) {
      Main.mainWindow.webContents.openDevTools();
    }

    Main.mainWindow.on("closed", Main.onClose);
  }

  static onWindowAllClosed() {
    if (process.platform !== "darwin" || Main.quitOnCloseOSX) {
      Main.application.quit();
    }
  }

  static onActivate() {
    if (Main.mainWindow === null) {
      Main.onReady();
    }
  }

  static onClose() {
    // Dereference the window object.
    Main.mainWindow = null;
  }

  static onError(error) {
    if (error.syscall !== "listen") {
      throw error;
    }
    const bind =
      typeof Main.port === "string" ? "Pipe " + Main.port : "Port " + Main.port;
    switch (error.code) {
      case "EACCES":
        // tslint:disable-next-line:no-console
        console.error(`${bind} requires elevated privileges`);
        process.exit(1);
      case "EADDRINUSE":
        // tslint:disable-next-line:no-console
        console.error(`${bind} is already in use`);
        process.exit(1);
      default:
        throw error;
    }
  }
}

// Ignore certificate authority errors
Electron.app.commandLine.appendSwitch("ignore-certificate-errors");
new Main(Electron.app, Electron.BrowserWindow);
