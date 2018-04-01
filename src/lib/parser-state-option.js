class Base {
}
class InCall extends Base {
    static get inst() {
        if(!this._inst) {
            this._inst = new this()
        }
        return this._inst
    }
}
class InAssignment extends Base {
    static get inst() {
        if(!this._inst) {
            this._inst = new this()
        }
        return this._inst
    }
}
export {Base, InCall, InAssignment}