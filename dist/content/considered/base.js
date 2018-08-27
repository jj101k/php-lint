"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const Known = __importStar(require("../known"));
class Base extends Known.Base {
    constructor(node) {
        super();
        this.node = node;
    }
    check() {
        console.log(`No checking supported for ${this.node.kind}`);
        return true;
    }
}
exports.Base = Base;
