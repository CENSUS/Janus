"use strict";

class AuthoritySign {
    constructor(payload) {
        if (
            !payload.nonce ||
            !payload.signature ||
            (payload.approved !== true && payload.approved !== false)
        ) {
            throw new Error(
                `Can not vote - Error in one (or more) of the given data: [NONCE: ${
                    payload.nonce ? "ACCEPTED" : "DENIED or EMPTY VALUE"
                }, SIGNATURE: ${
                    payload.signature ? "ACCEPTED" : "DENIED or EMPTY VALUE"
                }, APPROVED: ${
                    payload.approved === true || payload.approved === false
                        ? "ACCEPTED"
                        : "DENIED or MALFORMED VALUE"
                }]`
            );
        }

        this.nonce = payload.nonce;
        this.signature = payload.signature;
        this.approved = payload.approved;

        return this;
    }
}

module.exports = AuthoritySign;
