"use strict";

class Event {
    constructor(ctx, eventName, data) {
        this.ctx = ctx;
        this.eventName = eventName;
        if (typeof data === "object") {
            this.eventData = {};
            Object.assign(this.eventData, data);
        } else {
            this.eventData = data;
        }
    }

    serialize(data) {
        return Buffer.from(JSON.stringify(data));
    }

    assignEvent() {
        return this.ctx.stub.setEvent(
            this.eventName,
            this.serialize(this.eventData)
        );
    }
}

module.exports = Event;
