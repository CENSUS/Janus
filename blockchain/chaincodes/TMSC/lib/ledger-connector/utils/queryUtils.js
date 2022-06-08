"use strict";

class Queries {
    constructor(ctx, name) {
        this.ctx = ctx;
        this.name = name;
    }

    async getAssetHistory(key) {
        let ledgerKey = await this.ctx.stub.createCompositeKey(this.name, key);
        const resultsIterator = await this.ctx.stub.getHistoryForKey(ledgerKey);
        return await this.getAllResults(resultsIterator, true);
    }

    async queryKeyByPartial(partialKey) {
        if (arguments.length < 1) {
            throw new Error("Incorrect number of arguments");
        }
        const resultsIterator =
            await this.ctx.stub.getStateByPartialCompositeKey(
                this.name,
                partialKey
            );
        let method = this.getAllResults;
        return await method(resultsIterator, false);
    }

    async queryByAdhoc(queryString) {
        if (arguments.length < 1) {
            throw new Error("Incorrect number of arguments");
        }
        let self = this;
        if (!queryString) throw new Error("Empty query");

        let method = self.getQueryResultForQueryString;
        return await method(this.ctx, self, JSON.stringify(queryString));
    }

    async getQueryResultForQueryString(ctx, self, queryString) {
        const resultsIterator = await ctx.stub.getQueryResult(queryString);
        return await self.getAllResults(resultsIterator, false);
    }

    async getAllResults(iterator, isHistory) {
        let allResults = [];
        let res = { done: false, value: null };

        while (true) {
            res = await iterator.next();
            let jsonRes = {};
            if (res.value && res.value.value.toString()) {
                if (isHistory && isHistory === true) {
                    jsonRes.TxId = res.value.txId;
                    jsonRes.Timestamp = res.value.timestamp;
                    jsonRes.Timestamp = new Date(
                        res.value.timestamp.seconds.low * 1000
                    );
                    let ms = res.value.timestamp.nanos / 1000000;
                    jsonRes.Timestamp.setMilliseconds(ms);
                    if (res.value.is_delete) {
                        jsonRes.IsDelete = res.value.is_delete.toString();
                    } else {
                        try {
                            jsonRes.Value = JSON.parse(
                                res.value.value.toString("utf8")
                            );
                        } catch (err) {
                            jsonRes.Value = res.value.value.toString("utf8");
                        }
                    }
                } else {
                    jsonRes.Key = res.value.key;
                    try {
                        jsonRes.Record = JSON.parse(
                            res.value.value.toString("utf8")
                        );
                    } catch (err) {
                        jsonRes.Record = res.value.value.toString("utf8");
                    }
                }
                allResults.push(jsonRes);
            }
            if (res.done) {
                await iterator.close();
                return allResults;
            }
        }
    }
}

module.exports = Queries;
