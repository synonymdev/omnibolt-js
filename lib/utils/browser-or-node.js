"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isJsDom = exports.isNode = exports.isWebWorker = exports.isBrowser = void 0;
const isBrowser = () => {
    try {
        return typeof window !== 'undefined' && typeof window.document !== 'undefined';
    }
    catch {
        return false;
    }
};
exports.isBrowser = isBrowser;
const isWebWorker = () => {
    try {
        return typeof self === 'object'
            && self.constructor
            && self.constructor.name === 'DedicatedWorkerGlobalScope';
    }
    catch {
        return false;
    }
};
exports.isWebWorker = isWebWorker;
const isNode = () => {
    try {
        return typeof process !== 'undefined'
            && process.versions != null
            && process.versions.node != null;
    }
    catch {
        return false;
    }
};
exports.isNode = isNode;
const isJsDom = () => {
    try {
        return (typeof window !== 'undefined' && window.name === 'nodejs')
            || navigator.userAgent.includes('Node.js')
            || navigator.userAgent.includes('jsdom');
    }
    catch {
        return false;
    }
};
exports.isJsDom = isJsDom;
//# sourceMappingURL=browser-or-node.js.map