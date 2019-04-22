import { AssociativeArray, BaseArray, IndexedArray } from "./type/array"
import { Base, Mixed } from "./type/base"
import { Bool } from "./type/bool"
import { Class as _Class, Trait } from "./type/class"
import { ClassInstance } from "./type/class-instance"
import { Float } from "./type/float"
import { Function as _Function } from "./type/function"
import { Int } from "./type/int"
import { Null as _Null } from "./type/null"
export { Optional, OptionalFalse, OptionalNull } from "./type/optional"
export { Resource } from "./type/resource"
import { String as _String } from "./type/string"
export { Void } from "./type/void"


export { AssociativeArray, Base, BaseArray, Bool, _Class as Class, ClassInstance, Float, _Function as Function, IndexedArray, Int, Mixed, _Null as Null, _String as String, Trait }

export type InstanceType = Bool | ClassInstance | _Function | Float | IndexedArray | Int | Mixed | _Null | _String
export type StaticType = Bool | _Class | _Function | Float | IndexedArray | Int | Mixed | _Null | _String