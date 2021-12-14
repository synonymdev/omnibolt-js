/* global window self */

const isBrowser = (): boolean => {
	try {
		return typeof window !== 'undefined' && typeof window.document !== 'undefined';
	} catch {
		return false;
	}
}

/* eslint-disable no-restricted-globals */
const isWebWorker = (): boolean => {
	try {
		return typeof self === 'object'
		&& self.constructor
		&& self.constructor.name === 'DedicatedWorkerGlobalScope';
	} catch {
		return false;
	}
}
/* eslint-enable no-restricted-globals */

const isNode = (): boolean => {
	try {
		return typeof process !== 'undefined'
		&& process.versions != null
		&& process.versions.node != null;
	} catch {
		return false;
	}
}

/**
 * @see https://github.com/jsdom/jsdom/releases/tag/12.0.0
 * @see https://github.com/jsdom/jsdom/issues/1537
 */
/* eslint-disable no-undef */
const isJsDom = (): boolean => {
	try {
		return (typeof window !== 'undefined' && window.name === 'nodejs')
			|| navigator.userAgent.includes('Node.js')
			|| navigator.userAgent.includes('jsdom');
	} catch {
		return false;
	}
}

export {
	isBrowser, isWebWorker, isNode, isJsDom
};
