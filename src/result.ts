export type Result<T> = Ok<T> | Err<T>;

export class Ok<T> {
	public constructor(public readonly value: T) {}

	public isOk(): this is Ok<T> {
		return true;
	}

	public isErr(): this is Err<T> {
		return false;
	}
}

export class Err<T> {
	public constructor(public readonly error: Error) {
		if (error) console.info(error);
	}

	public isOk(): this is Ok<T> {
		return false;
	}

	public isErr(): this is Err<T> {
		return true;
	}
}

/**
 * Construct a new Ok result value.
 */
export const ok = <T>(value: T): Ok<T> => new Ok(value);

/**
 * Construct a new Err result value.
 */
export const err = <T>(error: Error | string): Err<T> => {
	if (typeof error === 'string') {
		return new Err(new Error(error));
	}

	return new Err(error);
};
