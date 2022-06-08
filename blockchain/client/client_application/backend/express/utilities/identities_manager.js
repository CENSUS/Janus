const { GeneralError } = require("../helper/data_processors/error_processor");

class IdentitiesManager {
  constructor() {
    this.identities = {};
  }

  // Public Section
  getIdentities(GID) {
    return this.identities[GID] || {};
  }

  getIdentity(GID, organization, username) {
    return this.identities[GID][organization][username] || {};
  }

  addIdentity(GID, identityUsername, organization, combinedIdentity) {
    if (!this.identities[GID]) {
      this.#createIdentityHolder(GID);
    }

    this.identities[GID] = {
      ...this.identities[GID],
      [organization]: {
        ...this.identities[GID][organization],
        [identityUsername]: { combinedIdentity, isActive: true },
      },
    };

    return this.identities[GID][organization][identityUsername];
  }

  removeIdentity(GID, organization, username) {
    if (!this.identities[GID])
      throw new GeneralError("There are no combined identities");
    if (!this.identities[GID][organization])
      throw new GeneralError(
        `There are no combined identities under organization ${organization}`
      );
    if (!this.identities[GID][organization][username])
      throw new GeneralError(
        `Unknown identity ${username} [Organization: ${organization}]`
      );

    delete this.identities[GID][organization][username];

    this.#checkIfShouldDeleteHolder(GID, organization);
  }

  toggleIdentity(GID, organization, username) {
    if (!this.identities[GID][organization][username])
      throw new GeneralError(
        `Unavailable Identity ${username} [Organization: ${organization}]`
      );

    const currentValue = this.identities[GID][organization][username].isActive;
    this.identities[GID][organization][username].isActive = !currentValue;

    return !currentValue;
  }

  // Private Section
  #createIdentityHolder(GID) {
    this.identities[GID] = {};
  }

  #checkIfShouldDeleteHolder(GID, organization = null) {
    if (
      organization &&
      Object.keys(this.identities[GID][organization]).length === 0
    ) {
      delete this.identities[GID][organization];
    }
    if (Object.keys(this.identities[GID]).length === 0) {
      delete this.identities[GID];
    }
  }
}

module.exports = new IdentitiesManager();
