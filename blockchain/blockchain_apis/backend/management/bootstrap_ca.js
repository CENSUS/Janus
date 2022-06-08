"use strict";

const _ = require("lodash");
const FabricCAServices = require("fabric-ca-client");
const { Certificate } = require("@fidm/x509");
const { GeneralError } = require("../middlewares/utils/error_types");
const styles = require("../config/styles.js");

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

    this.caCertificate = _.first(this.certificateAuthorityInfo.CACerts.pem);
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
        verify: true,
      },
      this.certificateAuthorityInfo.caName
    );
    console.log(
      styles.MAGENTA,
      `[${this.certificateAuthority}] Success - A CA Client was built`
    );
    this.caClient = caClient;
  }

  // Public Section

  // The certificate must be already `constructed`
  validateCertificate(certificate) {
    if (!this.caCertificateConstructed)
      this.caCertificateConstructed = Certificate.fromPEM(this.caCertificate);

    const isIssuer = certificate.isIssuer(this.caCertificateConstructed); // true is good
    const checkedSignature =
      this.caCertificateConstructed.checkSignature(certificate); // null is good

    if (isIssuer && checkedSignature === null) {
      return true;
    } else {
      return false;
    }
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
