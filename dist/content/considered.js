"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assign_1 = require("./considered/assign");
const base_1 = require("./considered/base");
exports.Base = base_1.Base;
const class_1 = require("./considered/class");
const echo_1 = require("./considered/echo");
exports.Echo = echo_1.Echo;
const function_1 = require("./considered/function");
exports.Function = function_1.Function;
const include_1 = require("./considered/include");
exports.Include = include_1.Include;
const program_1 = require("./considered/program");
exports.Program = program_1.Program;
const if_1 = require("./considered/if");
const call_1 = require("./considered/call");
const namespace_1 = require("./considered/namespace");
function forNode(node) {
    switch (node.kind) {
        case "assign":
            return new assign_1.Assign(node);
        case "call":
            return new call_1.Call(node);
        case "class":
            return new class_1.Class(node);
        case "echo":
            return new echo_1.Echo(node);
        case "function":
            return new function_1.Function(node);
        case "include":
            return new include_1.Include(node);
        case "if":
            return new if_1.If(node);
        case "namespace":
            return new namespace_1.Namespace(node);
        case "program":
            return new program_1.Program(node);
        default:
            return new base_1.Base(node);
    }
}
exports.forNode = forNode;
