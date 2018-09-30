import { Known } from "./type/known";
import { Function, Argument } from "./type/known/function";

export class Context {
    private globalNamespace: Map<string, Known>
    public assigning: boolean = false
    constructor(from_context?: Context) {
        if(from_context) {
            this.globalNamespace = from_context.globalNamespace
        } else {
            this.globalNamespace = new Map()
        }
    }
    /**
     * Asserts that the test passed, or throws.
     *
     * @param test A simple true/false value
     * @param message Optional message to describe what assertion failure means
     * @throws {Error} Invalid syntax
     */
    assert(test: boolean, message: string = "Invalid syntax"): void {
        if(!test) {
            throw new Error(message)
        }
    }
    get(name: string): Known | undefined {
        return this.globalNamespace.get(name)
    }
    /**
     * Returns true if the current (global) namespace has the given name.
     *
     * @param name eg. "$foo"
     */
    has(name: string): boolean {
        return this.globalNamespace.has(name)
    }
    /**
     * Sets an entry in the current (global) namespace.
     *
     * @param name eg. "$foo"
     * @param value
     */
    set(name: string, value: Known) {
        this.globalNamespace.set(name, value)
    }
}