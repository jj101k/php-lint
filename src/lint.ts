import { NodeTypes } from "./content/ast";
import { forNode } from "./content/considered";
export default class Lint {
    checkTree(tree: NodeTypes.Program): boolean {
        forNode(tree).check()
        return true
    }
}