import FabricCAServices from "fabric-ca-client";
import { acquireCAConnectionProfiles } from "../api/apiAccessor.js";
import { promiseHandler } from "./various.js";

class CertificateAuthority {
  constructor(organization) {
    this.CAClient = null;
    this.orgMspId = null;
    this.organization = organization;

    this.enrolledUser = null;
  }

  get getEnrolledUser() {
    return this.enrolledUser;
  }

  async #acquireCAInfo() {
    const payload = { organization: this.organization };
    const [caInfo, _] = await promiseHandler(
      acquireCAConnectionProfiles(payload)
    );

    return caInfo;
  }

  async buildCACommunicator() {
    const [CAInfo, _] = await promiseHandler(this.#acquireCAInfo());

    const {
      caUrl,
      caName,
      tlsCACerts: { pem: tlsCACertificate },
    } = CAInfo;

    this.orgMspId = CAInfo["orgMspId"];

    this.CAClient = new FabricCAServices(
      caUrl,
      {
        trustedRoots: tlsCACertificate,
        verify: true,
      },
      caName
    );
  }

  async enrollUser(credentials) {
    const { username: enrollmentID, password: enrollmentSecret } = credentials;

    const enrollment = await this.CAClient.enroll({
      enrollmentID,
      enrollmentSecret,
    });

    const x509Identity = {
      credentials: {
        certificate: enrollment.certificate,
        privateKey: enrollment.key.toBytes(),
      },
      mspId: this.orgMspId,
      type: "X.509",
    };

    this.enrolledUser = x509Identity;
  }
}

export default CertificateAuthority;
