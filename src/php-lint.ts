/**
 * The top-level lint support
 */
export default class PHPLint {
    /**
     * Checks the file
     */
    static checkFile(
        filename: string,
        depth: number = 0,
        working_directory: string|null = null
    ): Promise<boolean|null> {
        return new Promise(resolve => resolve(null))
    }
    /**
     * Checks the file and maybe throws (or warns)
     * @throws
     */
    static checkFileSync(
        filename: string,
        throw_on_error: boolean = true,
        depth: number = 0,
        working_directory: boolean|null = null
    ): boolean|null {
        return null
    }
    /**
     * Checks the code
     */
    static checkSourceCode(
        code: string,
        depth: number = 0
    ): Promise<boolean|null> {
        return new Promise(resolve => resolve(null))
    }
    /**
     * Checks the code and maybe throws (or warns)
     * @throws
     */
    static checkSourceCodeSync(
        code: string,
        throw_on_error: boolean = true,
        depth: number = 0
    ): boolean|null {
        return null
    }
    /**
     * Resets any global state, eg. if you're checking multiple different projects
     */
    static resetGlobalState(): PHPLint {
        return this
    }
}