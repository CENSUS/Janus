const { Wallets } = require("fabric-network");
const path = require("path");
const { GeneralError } = require("../helper/data_processors/error_processor");
const { promiseHandler } = require("../helper/data_processors/processor");

class WalletManager {
  constructor() {
    this.systemWalletPath = path.join(
      process.cwd(),
      "wallets",
      "system-wallets"
    );
    this.generalWalletPath = path.join(
      process.cwd(),
      "wallets",
      "general-wallets"
    ); // Used by Admins, Auditors etc.
    this.gidWalletPath = path.join(process.cwd(), "wallets", "gid-wallets");
  }

  getWalletPragma() {
    return Wallets;
  }

  async buildInMemoryWallet() {
    const [inMemoryWallet, inMemoryWalletError] = await promiseHandler(
      Wallets.newInMemoryWallet()
    );
    if (inMemoryWalletError) {
      throw new GeneralError(
        `Error while building an In-Memory Wallet: ${inMemoryWalletError.message}`
      );
    }
    return inMemoryWallet;
  }

  async buildTempWallet(organization, gidEndpoint = null) {
    // A temp wallet can only be a general/GID wallet
    const walletPrePath =
      gidEndpoint !== null ? this.gidWalletPath : this.generalWalletPath;
    const walletEndpoint =
      gidEndpoint !== null ? [gidEndpoint, organization] : [organization];
    const finalWalletPath = path.join(walletPrePath, ...walletEndpoint);

    const [walletBuild, walletBuildError] = await promiseHandler(
      Wallets.newFileSystemWallet(finalWalletPath)
    );
    if (walletBuildError) {
      throw new GeneralError(
        `Error while building a ${
          gidEndpoint !== null ? "GID" : "GENERAL"
        }  Wallet: ${walletBuildError.message}`
      );
    }
    return walletBuild;
  }

  async buildSystemWallet(organization) {
    if (!organization) {
      throw new GeneralError(
        "Error while building a System Wallet: Unknown organization"
      );
    }
    const finalWalletPath = path.join(this.systemWalletPath, organization);
    const [walletBuild, walletBuildError] = await promiseHandler(
      Wallets.newFileSystemWallet(finalWalletPath)
    );
    if (walletBuildError) {
      throw new GeneralError(
        `Error while building a System Wallet: ${walletBuildError.message}`
      );
    }
    console.log(
      `Success - A System wallet was built or retrieved (ORGANIZATION: ${organization})`
    );
    return walletBuild;
  }
}

module.exports = new WalletManager();
