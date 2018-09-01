export namespace NodeTypes {
    type Position = {line: number, column: number, offset: number}
    type Location = {source: string | null, start: Position, end: Position}
    type Comment = {value: string}
    type AnyNode = {loc: Location | null, leadingComments: Comment[], trailingComments: Comment[], kind: string}
    type AnyStatement = AnyNode
    type AnyDeclaration = AnyStatement & {name: string}
    type AnyBlock = AnyStatement & {children: Node[]}
    type AnySys = AnyStatement & {arguments: Node[]}
    type AnyExpression = AnyNode
    type AnyLiteral = AnyExpression & {raw: string, value: Node | string | number | boolean | null}

    type Error = {message: string, line: number, token: number | string, expected: string | any[]}
    type Identifier = AnyNode & {kind: "identifier", name: string, resolution: string}

    export type Array = AnyExpression & {kind: "array", items: (Entry | Expression | Variable)[], shortForm: boolean}
    export type Assign = AnyStatement & {kind: "assign", left: Expression, right: Expression, operator: string}
    export type Call = AnyStatement & {kind: "call", what: Identifier | Variable | null, arguments: Expression[]}
    export type Class = AnyDeclaration & {kind: "class", extends: Identifier | null, implements: Identifier[], body: Declaration[], isAnonymous: boolean, isAbstract: boolean, isFinal: boolean}
    export type Closure = AnyStatement & {kind: "closure", arguments: Parameter[], uses: Variable[], type: Identifier, byref: boolean, nullable: boolean, body: Block, isStatic: boolean}
    export type Echo = AnySys & {kind: "echo", shortForm: boolean}
    export type Entry = AnyNode & {kind: "entry", key: Node | null, value: Node}
    export type If = AnyStatement & {kind: "if", test: Expression, body: Block, alternate: Block | If | null, shortForm: boolean}
    export type Function = AnyDeclaration & {kind: "function", arguments: Parameter[], type: Identifier, byref: boolean, nullable: boolean, body: Block | null}
    export type Include = AnyStatement & {kind: "include", target: Node, once: boolean, require: boolean}
    export type Method = Function & {kind: "method", isAbstract: boolean, isFinal: boolean, isStatic: boolean, visibility: string}
    export type Namespace = AnyBlock & {kind: "namespace", name: string, withBrackets: boolean}
    export type New = AnyStatement & {kind: "new", what: Identifier | Variable | Class, arguments: Expression[]}
    export type Number = AnyLiteral & {kind: "number"}
    export type Parameter = AnyDeclaration & {kind: "parameter", type: Identifier | null, value: Node | null, byref: boolean, variadic: boolean, nullable: boolean}
    export type Program = AnyBlock & {kind: "program", errors: Error[], comments: Comment[], tokens: string[]}
    export type String = AnyLiteral & {kind: "string", unicode: boolean, isDoubleQuote: boolean}
    export type Variable = AnyExpression & {kind: "variable", name: string | Node, byref: boolean, curly: boolean}

    type Declaration = Class | Function | Parameter | Method
    type Expression = Variable
    type Block = Program | Namespace
    export type Node = Block | Declaration | Expression | Assign | Echo | Include | If | Call | String | Number | Closure | New | Array | Entry | Identifier
}