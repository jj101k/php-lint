import Context from "../context"
import ContextTypes from "../context-types"
import Constant from "./constant"
export default class ClassConstant extends Constant {
    /** @type {boolean} */
    get isStatic() {
        return this.node.isStatic
    }
    /** @type {string} */
    get visibility() {
        return this.node.visibility
    }
}
