import Context from "../context"
import ContextTypes from "../context-types"
import Statement from "./statement"
import {PHPFunctionType, PHPTypeUnion, PHPSimpleType} from "../phptype"
import Identifier from "./identifier"
import Variable from "./variable"
import _String from "./string"
import Bin from "./bin"
import Magic from "./magic"
import Doc from "./doc"
export default class Call extends Statement {
    /**
     * @type {Object[]}
     */
    get arguments() {
        return this.cacheNodeArray("arguments")
    }
    /**
     * @type {Identifier|Variable|null}
     */
    get what() {
        return this.cacheNode("what")
    }
    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @param {parserStateOptions} [parser_state]
     * @param {?Doc} [doc]
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, parser_state = {}, doc = null) {
        super.check(context, parser_state, doc)
        let pbr_positions
        let callback_positions
        let callable_types = this.what.check(context, {inCall: true}, null).expressionType
        let callable_type = callable_types.types[0]
        if(callable_type instanceof PHPFunctionType) {
            pbr_positions = callable_type.passByReferencePositions
            callback_positions = callable_type.callbackPositions
        } else {
            pbr_positions = {}
            callback_positions = {}
        }
        this.arguments.forEach((arg, i) => {
            if(pbr_positions[i]) {
                let inner_context = context.childContext(true)
                inner_context.assigningType = context.findName(arg.name) || PHPSimpleType.coreTypes.mixed
                arg.check(inner_context, {}, null)
            } else if(callback_positions[i]) {
                let inner_context = context.childContext(false)
                inner_context.importNamespaceFrom(context)
                inner_context.setName("$this", callback_positions[i])
                arg.check(inner_context, {}, null)
            } else {
                arg.check(context, {}, null)
            }
        })
        if(
            this.what instanceof Identifier &&
            this.what.name == "chdir"
        ) {
            if(this.arguments[0] instanceof _String) {
                context.chdir(this.arguments[0].value)
            } else if(
                this.arguments[0] instanceof Bin &&
                this.arguments[0].type == "." &&
                this.arguments[0].left instanceof Magic &&
                this.arguments[0].left.value == "__DIR__" &&
                this.arguments[0].right instanceof _String
            ) {
                context.chdir(context.fileContext.directory + this.arguments[0].right.value)
            }
        }
        let types = PHPTypeUnion.empty
        callable_types.types.forEach(t => {
            if(t instanceof PHPFunctionType) {
                types = types.addTypesFrom(t.returnType)
            } else {
                types = types.addTypesFrom(PHPSimpleType.coreTypes.mixed)
            }
        })
        return new ContextTypes(types)
    }
}
