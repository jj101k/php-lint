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
const variable_1 = require("./considered/variable");
const string_1 = require("./considered/string");
const number_1 = require("./considered/number");
const closure_1 = require("./considered/closure");
const new_1 = require("./considered/new");
const array_1 = require("./considered/array");
function forNode(node) {
    switch (node.kind) {
        case "array":
            return new array_1.Array(node);
        case "assign":
            return new assign_1.Assign(node);
        case "call":
            return new call_1.Call(node);
        case "class":
            return new class_1.Class(node);
        case "closure":
            return new closure_1.Closure(node);
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
        case "new":
            return new new_1.New(node);
        case "number":
            return new number_1.Number(node);
        case "program":
            return new program_1.Program(node);
        case "string":
            return new string_1.String(node);
        case "variable":
            return new variable_1.Variable(node);
        default:
            return new base_1.Base(node);
    }
}
exports.forNode = forNode;
