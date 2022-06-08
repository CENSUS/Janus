"use strict";

const { constructMetadataResponse } = require("../../utils/utils");

class Queries {
    constructor(ctx, name) {
        this.ctx = ctx;
        this.name = name;
    }

    async queryStateWithPaginationAndComposite(key, pageSize, bookmark) {
        const { iterator, metadata } =
            await this.ctx.stub.getStateByPartialCompositeKeyWithPagination(
                this.name,
                key,
                pageSize,
                bookmark
            );
        const method = this.getAllResults;
        const results = await method(iterator, false);
        return {
            results,
            bookmark: metadata.bookmark,
        };
    }

    async queryStateWithPaginationAndQuery(queryString, pageSize, bookmark) {
        const { iterator, metadata } =
            await this.ctx.stub.getQueryResultWithPagination(
                JSON.stringify(queryString),
                pageSize,
                bookmark
            );
        const method = this.getAllResults;
        const results = await method(iterator, false);
        const responseMetadata = constructMetadataResponse(
            metadata.fetchedRecordsCount === pageSize,
            metadata.fetchedRecordsCount,
            metadata.bookmark
        );
        return { results, responseMetadata };
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
        const method = this.getAllResults;
        return await method(resultsIterator, false);
    }

    async queryByAdhoc(queryString) {
        if (arguments.length < 1) {
            throw new Error("Incorrect number of arguments");
        }
        const self = this;
        if (!queryString) throw new Error("Empty query");

        const method = self.getQueryResultForQueryString;
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
