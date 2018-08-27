"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const considered_1 = require("./content/considered");
class Lint {
    checkTree(tree) {
        considered_1.forNode(tree).check();
        return true;
    }
}
exports.default = Lint;
