import Statement from "./statement"
import {PHPFunctionType, PHPTypeUnion, PHPSimpleType} from "../phptype"
import Identifier from "./identifier"
import Variable from "./variable"
import _String from "./string"
import Bin from "./bin"
import Magic from "./magic"
import {Context, ContextTypes, Doc, ParserStateOption} from "./node"
import {ConstRef, StaticLookup} from "../shadowtree"
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
     *
     * @todo This doesn't understand Closure::bind except with arguments (..., <object>) or (..., null, <class>::class)
     * @param {Context} context
     * @param {Set<ParserStateOption.Base>} [parser_state]
     * @param {?Doc} [doc]
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, parser_state = new Set(), doc = null) {
        super.check(context, parser_state, doc)
        let pbr_positions
        /** @type {{[x: number]: PHPTypeUnion}} */
        let callback_positions
        let callable_types = this.what.check(context, new Set([ParserStateOption.InCall]), null).expressionType
        let callable_type = callable_types.types[0]
        if(
            this.what instanceof StaticLookup &&
            this.what.offset instanceof ConstRef &&
            this.what.offset.name == "bind" &&
            this.what.what instanceof Identifier &&
            context.resolveNodeName(this.what.what) == "\\Closure"
        ) {
            pbr_positions = {}
            let effective_this_type = this.arguments[1].check(context, new Set(), null).expressionType
            if(effective_this_type === PHPSimpleType.coreTypes.null) {
                let arg_2 = this.arguments[2]
                if(
                    arg_2 instanceof StaticLookup &&
                    arg_2.offset instanceof ConstRef &&
                    arg_2.offset.name == "class" &&
                    arg_2.what instanceof Identifier
                ) {
                    effective_this_type = PHPSimpleType.named(context.resolveNodeName(arg_2.what))
                } else {
                    effective_this_type = arg_2.check(context, new Set(), null).expressionType
                }
            }
            callback_positions = {
                0: effective_this_type
            }
        } else if(callable_type instanceof PHPFunctionType) {
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
                arg.check(inner_context, new Set(), null)
            } else if(callback_positions[i]) {
                let inner_context = context.childContext(false)
                inner_context.importNamespaceFrom(context)
                inner_context.setName("$this", callback_positions[i])
                inner_context.classContext = context.findClass(callback_positions[i].types[0].typeName)
                arg.check(inner_context, new Set(), null)
            } else {
                arg.check(context, new Set(), null)
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
