"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.err = exports.ok = exports.Err = exports.Ok = void 0;
class Ok {
    constructor(value) {
        this.value = value;
    }
    isOk() {
        return true;
    }
    isErr() {
        return false;
    }
}
exports.Ok = Ok;
class Err {
    constructor(error) {
        this.error = error;
        if (error)
            console.info(error);
    }
    isOk() {
        return false;
    }
    isErr() {
        return true;
    }
}
exports.Err = Err;
exports.ok = (value) => new Ok(value);
exports.err = (error) => {
    if (typeof error === 'string') {
        return new Err(new Error(error));
    }
    return new Err(error);
};
//# sourceMappingURL=result.js.map