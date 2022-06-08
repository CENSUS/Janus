"use strict";

class Event {
    constructor(ctx, eventName, obj) {
        this.ctx = ctx;
        this.eventName = eventName;
        this.eventData = {};
        Object.assign(this.eventData, obj);
    }

    serialize(object) {
        return Buffer.from(JSON.stringify(object));
    }

    assignEvent() {
        return this.ctx.stub.setEvent(
            this.eventName,
            this.serialize(this.eventData)
        );
    }
}

module.exports = Event;
