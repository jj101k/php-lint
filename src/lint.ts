import { NodeTypes } from "./content/ast";
import { Context } from "./context";
import PHPLint from "./php-lint";
export default class Lint {
    private phplint: PHPLint
    /**
     *
     * @param phplint The parent object, for recursive file lint requests
     */
    constructor(phplint: PHPLint) {
        this.phplint = phplint
    }
    checkTree(tree: NodeTypes.Program): boolean {
        new Context().check(tree)
        return true
    }
}