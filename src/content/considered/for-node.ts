import { NodeTypes } from "../ast";
import {Base} from "./base"
export const byKind: {[kind: string]: typeof Base} = {}
export function forNode(node: NodeTypes.Node): Base {
    if(byKind[node.kind]) {
        return new byKind[node.kind](node)
    }
    return new Base(node)
}