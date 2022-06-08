import { newIdentity, newSigner } from "./gateway_utilities/utils.js";
import { connect } from "@hyperledger/fabric-gateway";
import { arrayToUINT8Array } from "./../utilities/various.js";

class ClientGateway {
  constructor(identity) {
    this.identity = newIdentity(identity);
    this.signer = newSigner(identity);

    this.gateway = connect({
      client: {},
      identity: this.identity,
      signer: this.signer,
    });
  }

  // Common Actions
  createProposal(functionParams, args) {
    const proposal = this.gateway
      .getNetwork(functionParams.channel)
      .getContract(functionParams.contract)
      .newProposal(functionParams.invokedFunction, {
        arguments: args.map((arg) => JSON.stringify(arg)),
      });

    return proposal;
  }

  async signProposal(proposal) {
    const proposalBytes = proposal.getBytes();
    const proposalDigest = proposal.getDigest();

    // Sign the proposal
    const signedDigest = await this.signer(proposalDigest);

    const signedProposalData = {
      proposalBytes: proposalBytes,
      signedDigest: signedDigest,
    };

    return signedProposalData;
  }

  // Evaluation Actions
  constructEvaluationProposal(signedProposal) {
    const { proposalBytes, signedDigest } = signedProposal;

    return {
      signedProposal: {
        proposalBytes: Array.from(proposalBytes),
        signedDigest: Array.from(signedDigest),
      },
    };
  }

  // Endorse Actions
  constructEndorsementProposal(signedProposal) {
    const { proposalBytes, signedDigest } = signedProposal;

    return {
      signedProposal: {
        proposalBytes: Array.from(proposalBytes),
        signedDigest: Array.from(signedDigest),
      },
    };
  }

  // Commit Actions
  constructCommitTransaction(signedProposal) {
    const { signedDigest } = signedProposal;

    return {
      signedEndorsedTransaction: {
        signedDigest: Array.from(signedDigest),
      },
    };
  }

  async signEndorsedTransaction(endorsedProposal) {
    const {
      endorsedProposal: { transactionBytes, transactionDigest },
    } = endorsedProposal;

    const signedDigest = await this.signer(transactionDigest);

    return {
      transactionBytes,
      signedDigest,
    };
  }

  // Various Actions

  prepareSignedEndorsedTransactionForBackend(signedTransaction) {
    const {
      signedEndorsedTransaction: { transactionDigest },
    } = signedTransaction;

    return {
      signedEndorsedTransaction: {
        signedDigest: Array.from(transactionDigest),
      },
    };
  }

  parseBackendEndorsedProposalResponse(endorsedProposal) {
    const {
      endorsedProposal: { transactionBytes, transactionDigest },
    } = endorsedProposal;

    const parsedTransactionBytes = arrayToUINT8Array(transactionBytes);
    const parsedTransactionDigest = Buffer.from(transactionDigest, "base64");

    return {
      endorsedProposal: {
        transactionBytes: parsedTransactionBytes,
        transactionDigest: parsedTransactionDigest,
      },
    };
  }
}

export default ClientGateway;
