"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const base_1 = require("./base");
const considered_1 = require("../considered");
class Program extends base_1.Base {
    constructor(node) {
        super(node);
        this.node = node;
    }
    check() {
        this.node.children.forEach(child => considered_1.forNode(child).check());
        return true;
    }
}
exports.Program = Program;
