"use strict";

const { jsonParser, promiseHandler } = require("../utils");

const BASECHANNEL = "basechannel";

class ChaincodeCommunicator {
    constructor(ctx, obj) {
        this.ctx = ctx;
        Object.assign(this, obj);
        this.response = undefined;
        this.error = undefined;
    }

    toBuffer(data) {
        return Buffer.from(data, "base64");
    }

    fromBuffer(data) {
        return Buffer.from(data, "base64").toString("utf-8");
    }

    serialize(object) {
        return Buffer.from(JSON.stringify(object));
    }

    resolveResponse() {
        try {
            let response = jsonParser(this.response);

            if (response.status !== 200) {
                this.error = this.fromBuffer(response.message);
                return;
            }

            response = this.toBuffer(response.payload);
            response = jsonParser(response.toString("utf-8"));

            if (response.status !== 200) {
                this.error = response.message;
                return;
            }

            response = this.toBuffer(response.payload);
            response = jsonParser(response.toString("utf-8"));
            this.response = response;
        } catch (err) {
            this.error = err.message;
        }
    }

    async makeContact(args) {
        args = args.map((arg) => this.serialize(arg));

        [this.response, this.error] = await promiseHandler(
            this.ctx.stub.invokeChaincode(
                this.chaincodeName,
                [this.chaincodeFn, ...args],
                this.channel || BASECHANNEL
            )
        );

        if (!this.error) this.resolveResponse();
    }

    static createInstance(
        ctx,
        chaincodeName,
        chaincodeFn,
        channel = undefined
    ) {
        return new ChaincodeCommunicator(ctx, {
            chaincodeName,
            chaincodeFn,
            channel,
        });
    }
}

module.exports = ChaincodeCommunicator;
