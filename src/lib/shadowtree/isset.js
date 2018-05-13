import Sys from "./sys"
import {Context, ContextTypes, Doc, ParserStateOption} from "./node"
import * as PHPType from "../php-type"
import {default as BooleanState, Assertion, ValueState} from "../boolean-state";
import Variable from "./variable";
export default class Isset extends Sys {
    /**
     * Checks that syntax seems ok
     * @param {Context} context
     * @param {Set<ParserStateOption.Base>} [parser_state]
     * @param {?Doc} [doc]
     * @returns {?ContextTypes} The set of types applicable to this value
     */
    check(context, parser_state = new Set(), doc = null) {
        super.check(context, parser_state, doc)
        let bs = new BooleanState().withType(PHPType.Core.types.bool)
        for(let a of this.arguments) {
            if(a instanceof Variable) {
                let name = '$' + a.name
                bs.trueStates[0].assertions.push(
                    new Assertion(
                        true,
                        name,
                        PHPType.Core.types.null
                    )
                )
                bs.falseStates = bs.falseStates.concat(
                    bs.falseStates.map(
                        s => new ValueState(
                            s.value,
                            s.assertions.concat([
                                new Assertion(
                                    false,
                                    name,
                                    PHPType.Core.types.null
                                )
                            ])
                        )
                    )
                )
            } else {
                break
            }
        }
        return new ContextTypes(
            PHPType.Core.types.bool,
            PHPType.Union.empty,
            bs
        )
    }
}
