"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const base_1 = require("./base");
class String extends base_1.Base {
    constructor(node) {
        super(node);
        this.node = node;
    }
    check() {
        return true;
    }
}
exports.String = String;
