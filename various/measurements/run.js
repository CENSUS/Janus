dotenv.config();
import chalk from "chalk";
import dotenv from "dotenv";
import publicIp from "public-ip";
import SystemMeasurements from "./system_measurements.js";
import Inquirer from "./user_manage.js";
import CertificateAuthority from "./utilities/ca_communicator.js";
import { logMsg, readFile } from "./utilities/various.js";
const subjectsFilePath = process.env.SUBJECTS_FILE_PATH;

class Main {
  constructor() {
    this.ENDPOINTS = {};
    this.subjectsFile = null;

    this.clientsManage = null;
  }

  async prepare() {
    const isIpAvailable =
      process.env.PUBLIC_IP && process.env.PUBLIC_IP !== "NOT_DEFINED";

    const customDNS = process.env.CUSTOM_DNS ? process.env.CUSTOM_DNS : "";

    // Determine the current public IP
    const currentIp = isIpAvailable
      ? process.env.PUBLIC_IP
      : (await publicIp.v4()) + customDNS;
    logMsg(
      chalk.blue.bgYellow.bold(
        `🚀 ~ Using current Public IP: ${currentIp}\n` +
          `The IP was ${
            isIpAvailable
              ? "derived from the .env file (PUBLIC_IP entry)"
              : "automatically determined! (You may edit the Public IP value in the .env file (PUBLIC_IP entry))"
          }`
      )
    );

    // Constructing the BASE Endpoints
    const availableEndpoints = JSON.parse(process.env.ENDPOINTS);
    Object.entries(availableEndpoints).forEach(([key, value]) => {
      this.ENDPOINTS[key] = `https://api.${currentIp}${value}`;
    });
  }

  async chooseClients() {
    // Read the SUBJECTS file
    this.subjectsFile = readFile(subjectsFilePath);
    logMsg(
      chalk.white.bgGreen.bold(
        `📁 ~ Successfully loaded the available subjects! File used: ${subjectsFilePath}`
      )
    );

    this.clientsManage = new Inquirer(this.subjectsFile);
    await this.clientsManage.doPrompt();
  }

  async deployCA(user) {
    const {
      clientCreds: { username, password },
      organization,
    } = user;

    const certAuthority = new CertificateAuthority(organization.toLowerCase());
    await certAuthority.buildCACommunicator();

    await certAuthority.enrollUser({
      username,
      password,
    });

    const enrolledUser = certAuthority.getEnrolledUser;
    return enrolledUser;
  }

  async run(username, organization, enrolledUser, nrInvs, dataID) {
    const systemMeasurements = new SystemMeasurements(
      username,
      organization,
      this.ENDPOINTS,
      enrolledUser,
      dataID,
      nrInvs
    );
    await systemMeasurements.init();
  }
}

const main = new Main();

main.prepare().then(async () => {
  await main.chooseClients().then(() =>
    Object.values(main.clientsManage.clients).forEach(
      async (client) =>
        await main.deployCA(client).then((enrolledUser) => {
          const {
            clientCreds: { username },
            organization,
            nrInvs: invocations,
            dataid,
          } = client;
          main
            .run(username, organization, enrolledUser, invocations, dataid)
            .then(() => {
              logMsg(
                chalk.bgGreen.black.bold(
                  `[${organization}, ${username}] - The Requests were successfully constructed. Please wait...`
                )
              );
            });
        })
    )
  );
});

export default main;
