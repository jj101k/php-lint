import { NodeTypes } from "./content/ast";
import { Context } from "./context";
export default class Lint {
    checkTree(tree: NodeTypes.Program): boolean {
        new Context().check(tree)
        return true
    }
}