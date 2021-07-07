"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.err = exports.ok = exports.Err = exports.Ok = void 0;
class Ok {
    value;
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
    error;
    constructor(error) {
        this.error = error;
        console.error(error);
    }
    isOk() {
        return false;
    }
    isErr() {
        return true;
    }
}
exports.Err = Err;
const ok = (value) => new Ok(value);
exports.ok = ok;
const err = (error) => {
    if (typeof error === 'string') {
        return new Err(new Error(error));
    }
    return new Err(error);
};
exports.err = err;
