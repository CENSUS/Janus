"use strict";

const FabricCAServices = require("fabric-ca-client");
const { GeneralError } = require("../helper/data_processors/error_processor");
const _ = require("lodash");
const styles = require("../helper/various/indicators");

const instanceAr = {};
module.exports = class CertificateAuthority {
  constructor(organization) {
    if (arguments.length < 1) {
      throw new GeneralError("Wrong number of arguments");
    }

    if (instanceAr[organization]) return instanceAr[organization];

    this.isInitialized = false;

    this.organization = organization;

    this.certificateAuthority = null;
    this.certificateAuthorityInfo = null;
    this.organizationMspId = null;
    this.ccp = null;
    this.caClient = null;
  }

  // Public Section
  initializeInstance(ccp) {
    if (this.isInitialized) throw new GeneralError("Already initialized");
    this.ccp = ccp;

    this.#defineCAData();
    this.#buildCACommunicator();

    this.isInitialized = true;
  }

  getCAClient() {
    return this.caClient;
  }

  getOrgMspId() {
    return this.organizationMspId;
  }

  // Private Section
  #defineCAData() {
    this.certificateAuthority = _.first(
      this.ccp.organizations[this.organization].certificateAuthorities
    );

    this.organizationMspId = this.ccp.organizations[this.organization].mspid;

    this.certificateAuthorityInfo =
      this.ccp.certificateAuthorities[this.certificateAuthority];
  }

  #buildCACommunicator() {
    console.log(
      styles.MAGENTA,
      `[${this.certificateAuthority}] Building a new CA Client...`
    );
    const caUrl = this.certificateAuthorityInfo.url;
    const caTLSCACerts = this.certificateAuthorityInfo.tlsCACerts.pem;
    const caClient = new FabricCAServices(
      caUrl,
      {
        trustedRoots: caTLSCACerts,
        verify: false,
      },
      this.certificateAuthorityInfo.caName
    );
    console.log(
      styles.MAGENTA,
      `[${this.certificateAuthority}] Success - CA Client was built`
    );
    this.caClient = caClient;
  }

  static getInstance(organization) {
    const instance = instanceAr[organization];

    if (!instance) {
      try {
        instanceAr[organization] = new CertificateAuthority(organization);

        console.log(
          "\x1b[34m%s\x1b[0m",
          `Certificate Authority connector for organization ${organization} is ready`
        );

        return instanceAr[organization];
      } catch (err) {
        console.log(
          `Error in new Certificate Authority instance with error: ${err}`
        );
        process.exit();
      }
    }
    return instance;
  }
};
