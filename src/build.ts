type arg_out = {
    byReference: boolean,
    defaultValue: string | null,
    name: string,
    optionalDepth: number,
    type: string | null
}
export type FunctionTypeInfo = {
    args: arg_out[],
    static: boolean,
    returnTypes: string[]
}