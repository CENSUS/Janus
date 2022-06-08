const { executablesExecs } = require("../../config/main_config");
const fs = require("fs");
const cors = require("cors");
const router = require("express").Router();
const path = require("path");

router.get(
  "/client-exec",
  cors({
    exposedHeaders: ["Content-Disposition"],
  }),
  async function (req, res, next) {
    const {
      query: { platform },
    } = req;

    const fileDetails = executablesExecs[platform];
    if (!fileDetails) {
      return;
    }

    const fileName = fileDetails.fileName;
    const fileURL = path.join("/application/executables", `${fileName}`);

    res.set({
      "Content-Disposition": `attachment; filename=${fileName}`,
      "Content-Type": "application/octet-stream",
    });

    res.download(fileURL);
  }
);

module.exports = router;
