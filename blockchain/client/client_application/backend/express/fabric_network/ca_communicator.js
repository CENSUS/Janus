const {
  UnauthorizedRequest,
  GeneralError,
} = require("../helper/data_processors/error_processor");

exports.enrollWithCA = async (caClient, userID, userPass, orgMspId, wallet) => {
  if (wallet) {
    console.log(`Enrolling (internal system) user ${userID}...`);
    const identity = await wallet.get(userID);

    if (identity) {
      console.log(
        `Success - User ${userID} (${orgMspId}) already exists. Reusing the user's wallet...`
      );
      return userID, wallet.get(userID);
    }
  }

  try {
    const enrollment = await caClient.enroll({
      enrollmentID: userID,
      enrollmentSecret: userPass,
    });

    const x509Identity = {
      credentials: {
        certificate: enrollment.certificate,
        privateKey: enrollment.key.toBytes(),
      },
      mspId: orgMspId,
      type: "X.509",
    };

    if (wallet) {
      await wallet.put(userID, x509Identity);
      console.log(
        `The enrollment was successful for (internal system) user ${userID}`
      );
    }

    return userID, x509Identity;
  } catch (error) {
    if (error.errors) {
      if (error.errors[0].code === 20) {
        throw new UnauthorizedRequest(`Wrong credentials for user: ${userID}`);
      } else {
        throw new GeneralError(`Authentication error`);
      }
    }
    throw new GeneralError(
      "The User Authentication System is down. Please, try again later."
    );
  }
};
