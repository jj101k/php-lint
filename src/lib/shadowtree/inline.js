import Context from "../context"
import ContextTypes from "../context-types"
import Literal from "./literal"
export default class Inline extends Literal {
    // No check needed - this is the gap between '?>' and the next '<?php'
}
