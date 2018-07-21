import Lint from "./lint";
/**
 * The top-level lint support
 */
export default class PHPLint {
    private _lint;
    readonly lint: Lint;
    /**
     * Checks the file
     *
     * @param depth How far recursion has gone. Very deep code may be skipped.
     */
    checkFile(filename: string, depth?: number, working_directory?: string | null): Promise<boolean | null>;
    /**
     * Checks the file and maybe throws (or warns)
     *
     * @param depth How far recursion has gone. Very deep code may be skipped.
     * @throws
     */
    checkFileSync(filename: string, throw_on_error?: boolean, depth?: number, working_directory?: string | null): boolean | null;
    /**
     * Checks the code
     *
     * @param depth How far recursion has gone. Very deep code may be skipped.
     */
    checkSourceCode(code: string, depth?: number): Promise<boolean | null>;
    /**
     * Checks the code and maybe throws (or warns)
     *
     * @param depth How far recursion has gone. Very deep code may be skipped.
     * @throws
     */
    checkSourceCodeSync(code: string, throw_on_error?: boolean, depth?: number): boolean | null;
}
