"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const base_1 = require("./base");
const considered_1 = require("../considered");
class Assign extends base_1.Base {
    constructor(node) {
        super(node);
        this.node = node;
    }
    check() {
        considered_1.forNode(this.node.left).check();
        considered_1.forNode(this.node.right).check();
        return true;
    }
}
exports.Assign = Assign;
