import { NodeTypes } from "./content/ast";
import { forNode } from "./content/considered";
import { Context } from "./context";
export default class Lint {
    checkTree(tree: NodeTypes.Program): boolean {
        forNode(tree).check(new Context())
        return true
    }
}