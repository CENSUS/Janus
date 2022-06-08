"use strict";
const FabricCAServices = require("fabric-ca-client");
const { GeneralError } = require("../helper/data_processors/error_processor");
const styles = require("../helper/config/indicators");
const { acquireCAConnectionProfiles } = require("../apis/apiAccessor");
const { promiseHandler } = require("../helper/data_processors/processor");

const instanceAr = {};
module.exports = class CertificateAuthority {
  constructor(organization) {
    if (arguments.length < 1) {
      throw new GeneralError("Wrong number of arguments");
    }

    if (instanceAr[organization]) return instanceAr[organization];

    this.isInitialized = false;

    this.organization = organization;
    this.caClient = null;
    this.caInfo = null;
  }

  // PUBLIC SECTION
  getCAClient() {
    return this.caClient;
  }

  getOrgMspId() {
    return this.caInfo.orgMspId;
  }

  // PRIVATE SECTION
  async #initializeInstance() {
    if (this.isInitialized) throw new GeneralError("Already initialized");

    try {
      await this.#buildCACommunicator();
    } catch (err) {
      throw new GeneralError(err.message);
    }

    this.isInitialized = true;
  }

  async #buildCACommunicator() {
    console.log(
      styles.MAGENTA,
      `[${this.organization}] Building a new CA Client...`
    );

    const [CAInfo, CAInfoErr] = await promiseHandler(this.#acquireCAInfo());

    if (CAInfoErr) throw new GeneralError(CAInfoErr);

    this.caInfo = CAInfo;

    const {
      caUrl,
      caName,
      tlsCACerts: { pem: tlsCACertificate },
    } = this.caInfo;

    const caClient = new FabricCAServices(
      caUrl,
      {
        trustedRoots: tlsCACertificate,
        verify: true,
      },
      caName
    );

    console.log(
      styles.MAGENTA,
      `[${this.organization}] Success - CA Client was built`
    );

    this.caClient = caClient;
  }

  async #acquireCAInfo() {
    const payload = { organization: this.organization };
    const [caInfo, caInfoErr] = await promiseHandler(
      acquireCAConnectionProfiles(payload)
    );

    if (caInfoErr) throw new GeneralError(caInfoErr);

    return caInfo;
  }

  static async getInstance(organization) {
    const instance = instanceAr[organization];

    if (!instance) {
      try {
        instanceAr[organization] = new CertificateAuthority(organization);

        await instanceAr[organization].#initializeInstance();

        console.log(
          "\x1b[34m%s\x1b[0m",
          `Certificate Authority connector for organization ${organization} is ready`
        );

        return instanceAr[organization];
      } catch (err) {
        throw new GeneralError(err.message);
      }
    }
    return instance;
  }
};
