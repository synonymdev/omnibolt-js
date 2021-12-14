export declare type Result<T> = Ok<T> | Err<T>;
export declare class Ok<T> {
    readonly value: T;
    constructor(value: T);
    isOk(): this is Ok<T>;
    isErr(): this is Err<T>;
}
export declare class Err<T> {
    readonly error: Error;
    constructor(error: Error);
    isOk(): this is Ok<T>;
    isErr(): this is Err<T>;
}
export declare const ok: <T>(value: T) => Ok<T>;
export declare const err: <T>(error: Error | string) => Err<T>;
