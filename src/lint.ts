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
    /**
     *
     * @param filename
     */
    checkFile(filename: string): boolean | null {
        try {
            return this.phplint.checkFileSync(
                filename,
                false,
                1,
                this.workingDirectory,
                true
            )
        } catch(e) {
            throw new Error(`${filename}: ${e.message}`)
        }
    }
    checkTree(tree: NodeTypes.Program, reuse_context = false, filename: string | null = null): boolean {
        try {
            if(!(this.lastContext && reuse_context)) {
                this.lastContext = new Context()
                this.lastContext.lint = this
            }
            this.lastContext.check(tree)
            return true
        } catch(e) {
            if(filename) {
                throw new Error(`${filename}: ${e.message}`)
            } else {
                throw e
            }
        }
    }
}