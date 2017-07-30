import Context from "../context"
import ContextTypes from "../context-types"
import Statement from "./statement"
import {PHPFunctionType, PHPTypeUnion} from "../phptype"
import Identifier from "./identifier"
import Variable from "./variable"
import _String from "./_string"
import Bin from "./bin"
import Magic from "./magic"
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
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, in_call = false) {
        super.check(context)
        let pbr_positions
        let callable_types = this.what.check(context, true).expressionType
        let callable_type = callable_types.types[0]
        if(callable_type instanceof PHPFunctionType) {
            pbr_positions = callable_type.passByReferencePositions
        } else {
            pbr_positions = {}
        }
        this.arguments.forEach((arg, i) => {
            if(pbr_positions[i]) {
                let inner_context = context.childContext(true)
                inner_context.assigningType = context.findName(arg.name) || PHPTypeUnion.mixed
                arg.check(inner_context)
            } else {
                arg.check(context)
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
                types = types.addTypesFrom(PHPTypeUnion.mixed)
            }
        })
        return new ContextTypes(types)
    }
}
