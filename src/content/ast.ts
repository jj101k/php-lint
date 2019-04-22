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
    export type Break = AnyNode & {kind: "break", level: Number | null}
    export type Call = AnyStatement & {kind: "call", what: Identifier | PropertyLookup | StaticLookup | Variable | null, arguments: Expression[]}
    export type Case = AnyNode & {kind: "case", test: Expression | null, body: Block | null}
    export type Cast = AnyOperation & {kind: "cast", type: string, raw: string, what: Expression}
    export type Catch = AnyStatement & {kind: "catch", what: Identifier[], variable: Variable, body: Statement}
    export type Class = AnyDeclaration & {kind: "class", extends: Identifier | null, implements: Identifier[], body: Declaration[], isAnonymous: boolean, isAbstract: boolean, isFinal: boolean}
    export type ClassConstant = AnyConstant & {kind: "classconstant", isStatic: boolean, visibility: string}
    export type Clone = AnyStatement & {kind: "clone", what: Expression}
    export type Closure = AnyStatement & {kind: "closure", arguments: Parameter[], uses: Variable[], type: Identifier, byref: boolean, nullable: boolean, body: Block, isStatic: boolean}
    export type ConstRef = AnyExpression & {kind: "constref", name: string | Identifier}
    export type Continue = AnyNode & {kind: "continue", level: Number | null}
    export type Declare = AnyBlock & {kind: "declare", what: {[ref: string]: Expression}, mode: string}
    export type Do = AnyStatement & {kind: "do", test: Expression, body: Statement}
    export type Echo = AnySys & {kind: "echo", shortForm: boolean}
    export type Empty = AnySys & {kind: "empty"}
    export type Encapsed = AnyLiteral & {kind: "encapsed", label: string | null, type: string, value: string}
    export type Entry = AnyNode & {kind: "entry", key: Node | null, value: Node}
    export type For = AnyStatement & {kind: "for", init: Expression[], test: Expression[], increment: Expression[], body: Statement, shortForm: boolean}
    export type Foreach = AnyStatement & {kind: "foreach", source: Expression, key: Expression | null, value: Expression, body: Statement, shortForm: boolean}
    export type Identifier = AnyNode & {kind: "identifier", name: string, resolution: "uqn" | "qn" | "fqn" | "rn"}
    export type If = AnyStatement & {kind: "if", test: Expression, body: Block, alternate: Block | If | null, shortForm: boolean}
    export type Isset = AnySys & {kind: "isset"}
    export type Function = AnyFunction & {kind: "function"}
    export type Include = AnyStatement & {kind: "include", target: Node, once: boolean, require: boolean}
    export type Inline = AnyLiteral & {kind: "inline", value: string}
    export type Interface = AnyDeclaration & {kind: "interface", extends: Identifier[], body: Declaration[]}
    export type List = AnySys & {kind: "list", shortForm: boolean}
    export type Magic = AnyLiteral & {kind: "magic"}
    export type Method = AnyFunction & {kind: "method", isAbstract: boolean, isFinal: boolean, isStatic: boolean, visibility: string}
    export type Namespace = AnyBlock & {kind: "namespace", name: string, withBrackets: boolean}
    export type New = AnyStatement & {kind: "new", what: Identifier | Variable | Class, arguments: Expression[]}
    export type Number = AnyLiteral & {kind: "number", value: number}
    export type OffsetLookup = AnyLookup & {kind: "offsetlookup"}
    export type Parameter = AnyDeclaration & {kind: "parameter", type: Identifier | null, value: Node | null, byref: boolean, variadic: boolean, nullable: boolean}
    export type Parenthesis = AnyOperation & {kind: "parenthesis", inner: Expression}
    export type Post = AnyOperation & {kind: "post", type: string, what: Variable}
    export type Program = AnyBlock & {kind: "program", errors: Error[], comments: Comment[], tokens: string[]}
    export type Property = AnyDeclaration & {kind: "property", isFinal: boolean, isStatic: boolean, visibility: string, value: Node | null}
    export type PropertyLookup = AnyLookup & {kind: "propertylookup"}
    export type RetIf = AnyStatement & {kind: "retif", test: Expression, trueExpr: Expression | null, falseExpr: Expression}
    export type Return = AnyNode & {kind: "return", expr: Expression | null}
    export type Silent = AnyStatement & {kind: "silent", expr: Expression | null}
    export type Static = AnyStatement & {kind: "static", items: Variable[] | Assign[]}
    export type StaticLookup = AnyLookup & {kind: "staticlookup"}
    export type String = AnyLiteral & {kind: "string", unicode: boolean, isDoubleQuote: boolean, value: string}
    export type Switch = AnyStatement & {kind: "switch", test: Expression, body: Block, shortForm: boolean}
    export type Throw = AnyStatement & {kind: "throw", what: Expression}
    export type Trait = AnyDeclaration & {kind: "trait", extends: Identifier | null, implements: Identifier[], body: Declaration[]}
    export type TraitUse = AnyNode & {kind: "traituse", traits: Identifier[], adaptations: Node[] | null}
    export type Try = AnyStatement & {kind: "try", body: Block, catches: Catch[], always: Block | null}
    export type Unary = AnyOperation & {kind: "unary", type: string, what: Expression}
    export type Unset = AnySys & {kind: "unset"}
    export type UseGroup = AnyStatement & {kind: "usegroup", name: string | null, type: string | null, items: UseItem[]}
    export type UseItem = AnyStatement & {kind: "useitem", name: string, type: string | null, alias: string | null}
    export type While = AnyStatement & {kind: "while", test: Expression, body: Statement, shortForm: boolean}
    export type Variable = AnyExpression & {kind: "variable", name: string | Node, byref: boolean, curly: boolean}
    export type Yield = AnyExpression & {kind: "yield", key: Expression | null, value: Expression | null}

    type AllBlock = Block | Declare | Namespace | Program
    type AllConstant = ClassConstant
    type AllFunction = Function | Method
    type Declaration = Class | AllFunction | Interface | Parameter | Property | Trait | AllConstant
    type Expression = Array | ConstRef | Operation | Lookup | Variable | Yield
    type Literal = Encapsed | Boolean | Inline | Magic | Number | String
    type Lookup = PropertyLookup | StaticLookup | OffsetLookup
    type Operation = Bin | Cast | Parenthesis | Post | Unary
    type Statement = Array | Assign | Call | Catch | Clone | Closure | Do | For | Foreach | If | Include | New | RetIf | Silent | Static | Switch | Throw | Try | UseGroup | UseItem | While
    type Sys = Echo | Empty | Isset | List | Unset
    export type Node =
        AllBlock |
        Break |
        Case |
        Continue |
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