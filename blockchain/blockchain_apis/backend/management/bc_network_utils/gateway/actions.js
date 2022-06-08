const { GeneralError } = require("../../../middlewares/utils/error_types");
const {
  promiseHandler,
  arrayToUINT8Array,
} = require("../../../utils/processors/various");

module.exports = {
  evaluateAction: async function evaluate(signedClientProposal) {
    let { proposalBytes, signedDigest } = signedClientProposal;
    proposalBytes = arrayToUINT8Array(proposalBytes);
    signedDigest = Buffer.from(signedDigest, "base64");

    const signedOrgProposal = this.peerGateway.newSignedProposal(
      proposalBytes,
      signedDigest
    );

    const [CCResponse, CCResponseErr] = await promiseHandler(
      signedOrgProposal.evaluate()
    );

    if (CCResponseErr) throw new GeneralError(CCResponseErr.message);

    return CCResponse;
  },
  endorseAction: async function endorse(signedClientProposal) {
    let { proposalBytes, signedDigest } = signedClientProposal;
    proposalBytes = arrayToUINT8Array(proposalBytes);
    signedDigest = arrayToUINT8Array(signedDigest);

    const signedOrgProposal = this.peerGateway.newSignedProposal(
      proposalBytes,
      signedDigest
    );

    const [endorsementRes, endorsementResErr] = await promiseHandler(
      signedOrgProposal.endorse()
    );

    if (endorsementResErr) throw new GeneralError(endorsementResErr.message);

    const endorsedTransaction = {
      transactionBytes: endorsementRes.getBytes(),
      transactionDigest: endorsementRes.getDigest(),
    };

    return endorsedTransaction;
  },
  commitAction: async function commit(savedBytes, signedDigest) {
    const transactionBytes = arrayToUINT8Array(savedBytes);
    const transactionDigest = arrayToUINT8Array(signedDigest);

    const signedTransaction = this.peerGateway.newSignedTransaction(
      transactionBytes,
      transactionDigest
    );

    const [commitRes, commitResErr] = await promiseHandler(
      signedTransaction.submit()
    );

    if (commitResErr) throw new GeneralError(commitResErr.message);

    const transactionResult = signedTransaction.getResult();

    return transactionResult;
  },
};
