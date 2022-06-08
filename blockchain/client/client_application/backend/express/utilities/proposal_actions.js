const { communicateWithBC } = require("../apis/apiAccessor");
const {
  normalizeCCResponseFromBackend,
  decodeText,
  chaincodeResponseResolver,
} = require("../helper/data_processors/client_processor");
const { GeneralError } = require("../helper/data_processors/error_processor");
const { promiseHandler } = require("../helper/data_processors/processor");
const ClientGateway = require("./clientGateway");
const fabproto6 = require("fabric-protos");

async function doEvaluate(
  identity,
  functionParams,
  ccArguments,
  serviceAuthorization
) {
  const gateway = new ClientGateway(identity);

  // Create the proposal
  const proposal = gateway.createProposal(functionParams, ccArguments);

  // Sign the proposal's digest
  const signedProposal = await gateway.signProposal(proposal);

  // Construct the proposal payload - This payload will be forwarded to the Backend API
  const proposalPayload = gateway.constructEvaluationProposal(signedProposal);

  // Forward the (evaluation) proposal and await for the response
  const [backendResponse, backendResponseErr] = await promiseHandler(
    communicateWithBC(serviceAuthorization, proposalPayload)
  );

  if (backendResponseErr) throw new GeneralError(backendResponseErr);

  const originalResponse = normalizeCCResponseFromBackend(backendResponse);
  const decodedResponse = decodeText(originalResponse);
  const ccResponse = chaincodeResponseResolver(decodedResponse);

  return ccResponse;
}

async function doCommit(
  identity,
  functionParams,
  ccArguments,
  serviceAuthorization
) {
  const gateway = new ClientGateway(identity);

  // Create the proposal
  const proposal = gateway.createProposal(functionParams, ccArguments);
  // Sign the proposal's digest
  const signedProposal = await gateway.signProposal(proposal);

  // Construct the proposal payload - This payload will be forwarded to the Backend API
  const signedProposalPayload =
    gateway.constructEndorsementProposal(signedProposal);

  // Forward the proposal and await for endorsement
  const [endorsedProposal, endorsedProposalErr] = await promiseHandler(
    communicateWithBC(serviceAuthorization, signedProposalPayload)
  );

  if (endorsedProposalErr) throw new GeneralError(endorsedProposalErr);

  // Parse the endorsed proposal to its original data (mainly, Array => Uint8Array)
  const parsedEndorsedProposal =
    gateway.parseBackendEndorsedProposalResponse(endorsedProposal);

  // verifyTransactionProposal(signedProposal, parsedEndorsedProposal);

  // Signed the (endorsed) transaction's digest
  const signedTransactionDigest = await gateway.signEndorsedTransaction(
    parsedEndorsedProposal
  );

  // Construct the transaction payload - This payload will be forwarded to the Backend API
  // Now we do not need to send the whole transaction info (i.e. TRANSACTION BYTES + DIGEST)
  // The `TRANSACTION BYTES` of the transaction are, temporarily, stored by the Backend API itself
  // Thus, we only need to send the signed digest of the transaction
  const transactionPayload = gateway.constructCommitTransaction(
    signedTransactionDigest
  );

  // Ask the Backend API to commit the transaction - The transaction payload includes only the (signed) transaction digest
  const [commitedTransaction, commitedTransactionErr] = await promiseHandler(
    communicateWithBC(serviceAuthorization, transactionPayload)
  );

  if (commitedTransactionErr) throw new GeneralError(commitedTransactionErr);

  const originalResponse = normalizeCCResponseFromBackend(commitedTransaction);
  const decodedResponse = decodeText(originalResponse);
  const commitResponse = chaincodeResponseResolver(decodedResponse);

  return commitResponse;
}

// function verifyTransactionProposal(originalProposal, transactionProposal) {
//   const asBuffer = (proposal) => {
//     var buf = Buffer.alloc(proposal.byteLength);
//     var view = new Uint8Array(proposal);
//     for (var i = 0; i < buf.length; ++i) {
//       buf[i] = view[i];
//     }
//     return buf;
//   };

//   const asBufferProposal = asBuffer(originalProposal.proposalBytes);
//   const asBufferTransactionProposal = asBuffer(
//     transactionProposal.endorsedProposal.transactionBytes
//   );

//   const originalProposalEnvelope =
//     fabproto6.common.Envelope.decode(asBufferProposal);

//   const transactionProposalEnvelope = fabproto6.common.Envelope.decode(
//     asBufferTransactionProposal
//   );

//   // console.log("Original Proposal: ", originalProposalEnvelope.toJSON());
//   // console.log("Transaction Proposal: ", transactionProposalEnvelope.toJSON());

//   // const chaincodeProposalPayloadNoTrans =
//   //     fabproto6.common.Envelope.create({
//   //         input: originalChaincodeProposalPayload.input, // only set the input field, skipping the TransientMap
//   //     });

//   // console.log(
//   //     chaincodeProposalPayloadNoTrans.toString("ascii")
//   // );

//   // Object.values(chaincodeProposalPayloadNoTrans.toString("utf8")).forEach(
//   //     (key) => console.log("Key ", key)
//   // );
// }

module.exports = { doEvaluate: doEvaluate, doCommit: doCommit };
