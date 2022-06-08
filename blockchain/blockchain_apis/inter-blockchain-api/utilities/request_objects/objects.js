"use strict";

class SyncEntityWithBC {
  constructor(type, parameter = null) {
    this.type = type;
    this.parameter = parameter;
    return this;
  }
}
module.exports = { SyncEntityWithBC };
