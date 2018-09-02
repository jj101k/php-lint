import { NodeTypes } from "./content/ast";
import { Considered } from "./content/considered";
import { Context } from "./context";
export default class Lint {
    checkTree(tree: NodeTypes.Program): boolean {
        Considered.forNode(tree).check(new Context())
        return true
    }
}