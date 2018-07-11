/**
 * The top-level lint support
 */
export default class PHPLint {
    /**
     * Checks the file
     */
    static checkFile(filename: string, depth?: number, working_directory?: string | null): Promise<boolean | null>;
    /**
     * Checks the file and maybe throws (or warns)
     * @throws
     */
    static checkFileSync(filename: string, throw_on_error?: boolean, depth?: number, working_directory?: boolean | null): boolean | null;
    /**
     * Checks the code
     */
    static checkSourceCode(code: string, depth?: number): Promise<boolean | null>;
    /**
     * Checks the code and maybe throws (or warns)
     * @throws
     */
    static checkSourceCodeSync(code: string, throw_on_error?: boolean, depth?: number): boolean | null;
    /**
     * Resets any global state, eg. if you're checking multiple different projects
     */
    static resetGlobalState(): PHPLint;
}
