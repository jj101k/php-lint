export declare namespace NodeTypes {
    type Position = {
        line: number;
        column: number;
        offset: number;
    };
    type Location = {
        source: string | null;
        start: Position;
        end: Position;
    };
    type Comment = {
        value: string;
    };
    type AnyNode = {
        loc: Location | null;
        leadingComments: Comment[];
        trailingComments: Comment[];
        kind: string;
    };
    type AnyStatement = AnyNode;
    type AnyDeclaration = AnyStatement & {
        name: string;
    };
    type AnyBlock = AnyStatement & {
        children: Node[];
    };
    type AnySys = AnyStatement & {
        arguments: Node[];
    };
    type AnyExpression = AnyNode;
    type Error = {
        message: string;
        line: number;
        token: number | string;
        expected: string | Array<any>;
    };
    type Identifier = AnyNode & {
        name: string;
        resolution: string;
    };
    type Assign = AnyStatement & {
        kind: "assign";
        left: Expression;
        right: Expression;
        operator: string;
    };
    type Call = AnyStatement & {
        kind: "call";
        what: Identifier | Variable | null;
        arguments: Expression[];
    };
    type Class = AnyDeclaration & {
        kind: "class";
        extends: Identifier | null;
        implements: Identifier[];
        body: Declaration[];
        isAnonymous: boolean;
        isAbstract: boolean;
        isFinal: boolean;
    };
    type Echo = AnySys & {
        kind: "echo";
        shortForm: boolean;
    };
    type If = AnyStatement & {
        kind: "if";
        test: Expression;
        body: Block;
        alternate: Block | If | null;
        shortForm: boolean;
    };
    type Function = AnyDeclaration & {
        kind: "function";
        arguments: Parameter[];
        type: Identifier;
        byref: boolean;
        nullable: boolean;
        body: Block | null;
    };
    type Include = AnyStatement & {
        kind: "include";
        target: Node;
        once: boolean;
        require: boolean;
    };
    type Namespace = AnyBlock & {
        kind: "namespace";
        name: string;
        withBrackets: boolean;
    };
    type Parameter = AnyDeclaration & {
        kind: "parameter";
        type: Identifier | null;
        value: Node | null;
        byref: boolean;
        variadic: boolean;
        nullable: boolean;
    };
    type Program = AnyBlock & {
        kind: "program";
        errors: Error[];
        comments: Comment[];
        tokens: string[];
    };
    type Variable = AnyExpression & {
        kind: "variable";
        name: string | Node;
        byref: boolean;
        curly: boolean;
    };
    type Declaration = Class | Function | Parameter;
    type Expression = Variable;
    type Block = Program | Namespace;
    type Node = Block | Declaration | Expression | Assign | Echo | Include | If | Call;
}
