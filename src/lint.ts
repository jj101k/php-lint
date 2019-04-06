import { NodeTypes } from "./content/ast";
import { Context } from "./context";
import PHPLint from "./php-lint";
export default class Lint {
    private lastContext: Context | null = null
    private phplint: PHPLint

    /**
     * The directory for relative includes. This may be mutated.
     */
    public workingDirectory: string | null = null

    /**
     *
     * @param phplint The parent object, for recursive file lint requests
     */
    constructor(phplint: PHPLint) {
        this.phplint = phplint
    }
    checkFile(filename: string): boolean | null {
        return this.phplint.checkFileSync(
            filename,
            false,
            1,
            this.workingDirectory,
            true
        )
    }
    checkTree(tree: NodeTypes.Program, reuse_context = false): boolean {
        if(!(this.lastContext && reuse_context)) {
            this.lastContext = new Context()
            this.lastContext.lint = this
        }
        this.lastContext.check(tree)
        return true
    }
}