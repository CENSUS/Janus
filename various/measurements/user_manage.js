import inquirer from "inquirer";
import fs from "fs";
import { jsonParser, logMsg, matchStrings } from "./utilities/various.js";
import chalk from "chalk";

export default class Inquirer {
  constructor(subjectsFile) {
    this.timeoutTime = process.env.DEFAULT_CLIENTS_METHOD_TIMEOUT;
    this.subjects = subjectsFile;

    this.clientLoadType = null;
    this.currentIndexKey = null;
    this.currentClient = null;

    this.clients = {};

    // Env. Vars
    this.AVAILABLE_DATAID_CHOICES =
      process.env.AVAILABLE_DATAID_CHOICES.split(",");

    this.defaultUsersFile = process.env.DEFAULT_USERS_FILE;
  }

  async doPrompt() {
    const availableAnswers = {
      "Automatically - Let the Tool load the clients from the Clients' File":
        this.#loadPredefinedClients.bind(this),
      "Manually - Choose the available Clients by hand":
        this.#createClient.bind(this),
    };

    await this.#checkPreloadedOrUserDefined(availableAnswers);
  }

  async #checkPreloadedOrUserDefined(availableAnswers) {
    await inquirer
      .prompt({
        type: "list",
        name: "clientLoadType",
        message: `Choose the way that you want to load the clients`,
        choices: Object.keys(availableAnswers),
      })
      .then(async (answer) => await availableAnswers[answer.clientLoadType]());
  }

  // Automatically Load Clients type answer
  #loadPredefinedClients() {
    const userFile = jsonParser(fs.readFileSync(this.defaultUsersFile, "utf8"));

    userFile.forEach(({ username, organization, dataid, reqInvs }) => {
      Object.entries(this.subjects)
        .map(([key, value]) => {
          const [clientType, organizations] = [key, value];

          if (!organizations[organization.toUpperCase()]) return;

          const foundAcc = Object.values(
            organizations[organization.toUpperCase()]
          )
            .map((availClients) => availClients)
            .filter((client) => matchStrings(client.account.username, username))
            .map((foundClient) => {
              const {
                account: {
                  role: foundRole,
                  username: foundUsername,
                  password: foundPassword,
                },
              } = foundClient;

              return {
                foundUsername,
                foundPassword,
                foundRole,
                organization,
                reqInvs,
              };
            })[0];

          if (foundAcc) {
            if (reqInvs <= 0) {
              logMsg(
                chalk.bgRed.white.bold(
                  `Invalid Request Number for Client: ${username}. You must ask for at least 1 request.`
                )
              );
            } else {
              this.#createClient(false);
              this.#addClientType(clientType);
              this.#addOrganization(organization.toUpperCase());
              this.#setClientCredentials({
                username,
                password: foundAcc.foundPassword,
              });
              this.#setDataID(dataid);
              this.#setNrInvs(reqInvs);

              return foundAcc;
            }
          }
        })
        .filter((clientExists) => clientExists);
    });

    console.log();
    logMsg(
      chalk.bgGreen.white.bold("Successfully added some clients:"),
      Object.values(this.clients).map(
        (client) =>
          `Username: ${client.clientCreds.username}, Organization: ${client.organization}, DataID: ${client.dataid}, Requests Nr.: ${client.nrInvs}`
      )
    );
  }

  // Create new Client
  async #createClient(createForms = true) {
    this.currentIndexKey = `client_` + (Object.keys(this.clients).length + 1);
    this.currentClient = this.clients[this.currentIndexKey] = {};

    createForms && (await this.#chooseClientType());
  }

  // Choose Client type answer
  async #chooseClientType() {
    await inquirer
      .prompt([
        {
          type: "list",
          name: "type",
          message: `Choose the Client's Type`,
          choices: Object.keys(this.subjects),
        },
      ])
      .then(async (answer) => {
        this.#addClientType(answer.type);
        await this.#chooseOrganization();
      });
  }

  async #chooseOrganization() {
    await inquirer
      .prompt([
        {
          type: "list",
          name: "organization",
          message: `Choose the Client's Organization`,
          choices: Object.keys(this.subjects[this.currentClient.clientType]),
        },
      ])
      .then(async (answer) => {
        this.#addOrganization(answer.organization);
        await this.#chooseClient();
      });
  }

  async #chooseClient() {
    await inquirer
      .prompt([
        {
          type: "list",
          name: "client",
          message: `Choose the Client`,
          choices: Object.values(
            this.subjects[this.currentClient.clientType][
              this.currentClient.organization
            ]
          ).map((client) => client.account.username),
        },
      ])
      .then(async (answer) => {
        this.#setClientCredentials({
          username: answer.client,
          password: Object.values(
            this.subjects[this.currentClient.clientType][
              this.currentClient.organization
            ]
          ).filter((client) => client.account.username === answer.client)[0]
            .account.password,
        });

        await this.#chooseDataID();
      });
  }

  async #chooseDataID() {
    await inquirer
      .prompt([
        {
          type: "list",
          name: "dataid",
          message: `Choose the request's Data ID`,
          choices: this.AVAILABLE_DATAID_CHOICES,
        },
      ])
      .then(async (answer) => {
        this.#setDataID(answer.dataid);
        await this.#chooseNrInvs();
      });
  }

  async #chooseNrInvs() {
    await inquirer
      .prompt([
        {
          type: "number",
          name: "nvInvs",
          message: `Requests Number [Default: 500]`,
          default: 3,
        },
      ])
      .then(async (answer) => {
        this.#setNrInvs(answer.nvInvs);
        await this.#askForAnotherClient();
      });
  }

  async #askForAnotherClient() {
    await inquirer
      .prompt([
        {
          type: "confirm",
          name: "addAnother",
          message: `Would you like to use another Client?`,
          default: false,
        },
      ])
      .then(async (answer) => {
        if (answer.addAnother) {
          await this.doPrompt();
        } else {
          logMsg(
            chalk.bgGreen.white.bold("Successfully added some clients:"),
            Object.values(this.clients).map(
              (client) =>
                `Username: ${client.clientCreds.username}, Organization: ${client.organization}, DataID: ${client.dataid}, Requests Nr.: ${client.nrInvs}`
            )
          );
          return;
        }
      });
  }

  // Helpers
  #addClientType(data) {
    this.currentClient.clientType = data;
  }

  #addOrganization(data) {
    this.currentClient.organization = data;
  }

  #setClientCredentials(data) {
    this.currentClient.clientCreds = data;
  }

  #setDataID(data) {
    this.currentClient.dataid = data;
  }

  #setNrInvs(data) {
    this.currentClient.nrInvs = data;
  }
}
