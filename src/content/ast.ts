export namespace NodeTypes {
    type binary_operand =
        "|" | "&" | "^" | "." | "+" | "-" | "*" | "/" | "%" | "**" | "<<" | ">>" |
        "||" | "or" | "&&" | "and" | "xor" | "===" | "!==" | "==" | "!=" | "<" | ">" |
        "<=" | ">=" | "<=>" | "instanceof" | "??"

    type Position = {line: number, column: number, offset: number}
    type Location = {source: string | null, start: Position, end: Position}
    type Comment = {value: string}
    type AnyNode = {loc: Location | null, leadingComments: Comment[], trailingComments: Comment[], kind: string}
    type AnyStatement = AnyNode
    type AnyBlock = AnyStatement & {children: Node[]}
    type AnyDeclaration = AnyStatement & {name: string}
    type AnyFunction = AnyDeclaration & {arguments: Parameter[], type: Identifier, byref: boolean, nullable: boolean, body: Block | null}
    type AnySys = AnyStatement & {arguments: Node[]}
    type AnyExpression = AnyNode
    type AnyLiteral = AnyExpression & {raw: string, value: Node | string | number | boolean | null}
    type AnyLookup = AnyExpression & {what: Expression, offset: Expression}
    type AnyOperation = AnyExpression
    type AnyConstant = AnyDeclaration & {value: Node | null}

    type Error = {message: string, line: number, token: number | string, expected: string | any[]}

    export type Block = AnyBlock & {kind: "block"}

    export type Array = AnyExpression & {kind: "array", items: (Entry | Expression | Variable)[], shortForm: boolean}
    export type Assign = AnyStatement & {kind: "assign", left: Expression, right: Expression, operator: string}
    export type Bin = AnyOperation & {kind: "bin", type: binary_operand, left: Expression, right: Expression}
    export type Boolean = AnyLiteral & {kind: "boolean", value: boolean}
    export type Call = AnyStatement & {kind: "call", what: Identifier | PropertyLookup | Variable | null, arguments: Expression[]}
    export type Class = AnyDeclaration & {kind: "class", extends: Identifier | null, implements: Identifier[], body: Declaration[], isAnonymous: boolean, isAbstract: boolean, isFinal: boolean}
    export type ClassConstant = AnyConstant & {kind: "classconstant", isStatic: boolean, visibility: string}
    export type Closure = AnyStatement & {kind: "closure", arguments: Parameter[], uses: Variable[], type: Identifier, byref: boolean, nullable: boolean, body: Block, isStatic: boolean}
    export type ConstRef = AnyExpression & {kind: "constref", name: string | Node}
    export type Echo = AnySys & {kind: "echo", shortForm: boolean}
    export type Entry = AnyNode & {kind: "entry", key: Node | null, value: Node}
    export type Foreach = AnyStatement & {kind: "foreach", source: Expression, key: Expression | null, value: Expression, body: Statement, shortForm: boolean}
    export type Identifier = AnyNode & {kind: "identifier", name: string, resolution: "uqn" | "qn" | "fqn" | "rn"}
    export type If = AnyStatement & {kind: "if", test: Expression, body: Block, alternate: Block | If | null, shortForm: boolean}
    export type Isset = AnySys & {kind: "isset"}
    export type Function = AnyFunction & {kind: "function"}
    export type Include = AnyStatement & {kind: "include", target: Node, once: boolean, require: boolean}
    export type Method = AnyFunction & {kind: "method", isAbstract: boolean, isFinal: boolean, isStatic: boolean, visibility: string}
    export type Namespace = AnyBlock & {kind: "namespace", name: string, withBrackets: boolean}
    export type New = AnyStatement & {kind: "new", what: Identifier | Variable | Class, arguments: Expression[]}
    export type Number = AnyLiteral & {kind: "number", value: number}
    export type OffsetLookup = AnyLookup & {kind: "offsetlookup"}
    export type Parameter = AnyDeclaration & {kind: "parameter", type: Identifier | null, value: Node | null, byref: boolean, variadic: boolean, nullable: boolean}
    export type Parenthesis = AnyOperation & {kind: "parenthesis", inner: Expression}
    export type Program = AnyBlock & {kind: "program", errors: Error[], comments: Comment[], tokens: string[]}
    export type Property = AnyDeclaration & {kind: "property", isFinal: boolean, isStatic: boolean, visibility: string, value: Node | null}
    export type PropertyLookup = AnyLookup & {kind: "propertylookup"}
    export type RetIf = AnyStatement & {kind: "retif", test: Expression, trueExpr: Expression | null, falseExpr: Expression}
    export type Return = AnyNode & {kind: "return", expr: Expression | null}
    export type StaticLookup = AnyLookup & {kind: "staticlookup"}
    export type String = AnyLiteral & {kind: "string", unicode: boolean, isDoubleQuote: boolean}
    export type TraitUse = AnyNode & {kind: "traituse", traits: Identifier[], adaptations: Node[] | null}
    export type Unary = AnyOperation & {kind: "unary", type: string, what: Expression}
    export type Variable = AnyExpression & {kind: "variable", name: string | Node, byref: boolean, curly: boolean}

    type AllBlock = Block | Namespace | Program
    type AllConstant = ClassConstant
    type AllFunction = Function | Method
    type Declaration = Class | AllFunction | Parameter | Property | AllConstant
    type Expression = Array | ConstRef | Operation | Lookup | Variable
    type Literal = String | Number | Boolean
    type Lookup = PropertyLookup | StaticLookup | OffsetLookup
    type Operation = Bin | Parenthesis | Unary
    type Statement = Array | Assign | Call | Closure | Foreach | If | Include | New | RetIf
    type Sys = Echo | Isset
    export type Node =
        AllBlock |
        Declaration |
        Entry |
        Expression |
        Identifier |
        Literal |
        Return |
        Statement |
        Sys |
        TraitUse
}