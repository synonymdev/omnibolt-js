"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateOmniboltUri = exports.parseOmniboltUri = exports.sleep = exports.promiseTimeout = exports.accMul = exports.signP2SH = exports.generateFundingAddress = exports.signP2PKH = exports.getPrivateKey = exports.getScriptHash = exports.getAddress = exports.getNextOmniboltAddress = void 0;
const result_1 = require("../result");
const networks_1 = require("./networks");
const bitcoin = require('bitcoinjs-lib');
const bip39 = require('bip39');
const bip32 = require('bip32');
exports.getNextOmniboltAddress = async ({ selectedNetwork, addressIndex, mnemonic, }) => {
    let index = 0;
    if (addressIndex &&
        addressIndex?.index >= 0 &&
        addressIndex?.path?.length > 0) {
        index = addressIndex.index + 1;
    }
    const coinType = selectedNetwork === 'bitcoinTestnet' ? '1' : '0';
    const addressPath = `m/44'/${coinType}'/2'/0/${index}`;
    const seed = bip39.mnemonicToSeedSync(mnemonic, '');
    const network = networks_1.networks[selectedNetwork];
    const root = bip32.fromSeed(seed, network);
    const addressKeypair = root.derivePath(addressPath);
    const address = exports.getAddress({
        keyPair: addressKeypair,
        network,
    });
    const scriptHash = exports.getScriptHash(address, network);
    return result_1.ok({
        index,
        path: addressPath,
        address,
        scriptHash,
        publicKey: addressKeypair.publicKey.toString('hex'),
    });
};
exports.getAddress = ({ keyPair = undefined, network = undefined, type = 'legacy', }) => {
    if (!keyPair || !network) {
        return '';
    }
    try {
        switch (type) {
            case 'bech32':
                return bitcoin.payments.p2wpkh({ pubkey: keyPair.publicKey, network })
                    .address;
            case 'segwit':
                return bitcoin.payments.p2sh({
                    redeem: bitcoin.payments.p2wpkh({
                        pubkey: keyPair.publicKey,
                        network,
                    }),
                    network,
                }).address;
            case 'legacy':
                return bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey, network })
                    .address;
        }
        return '';
    }
    catch {
        return '';
    }
};
exports.getScriptHash = (address = '', network = networks_1.networks.bitcoin) => {
    try {
        if (!address || !network) {
            return '';
        }
        if (typeof network === 'string' && network in networks_1.networks) {
            network = networks_1.networks[network];
        }
        const script = bitcoin.address.toOutputScript(address, network);
        let hash = bitcoin.crypto.sha256(script);
        const reversedHash = Buffer.from(hash.reverse());
        return reversedHash.toString('hex');
    }
    catch {
        return '';
    }
};
exports.getPrivateKey = async ({ addressData, selectedNetwork = 'bitcoin', mnemonic, }) => {
    try {
        if (!addressData) {
            return result_1.err('No addressContent specified.');
        }
        if (!mnemonic) {
            return result_1.err('No mnemonic phrase specified.');
        }
        const network = networks_1.networks[selectedNetwork];
        const bip39Passphrase = '';
        const seed = bip39.mnemonicToSeedSync(mnemonic, bip39Passphrase);
        const root = bip32.fromSeed(seed, network);
        const addressPath = addressData.path;
        const addressKeypair = root.derivePath(addressPath);
        return result_1.ok(addressKeypair.toWIF());
    }
    catch (e) {
        return result_1.err(e);
    }
};
exports.signP2PKH = ({ txhex, privkey, inputs, selectedNetwork = 'bitcoin' }) => {
    if (txhex === '')
        return '';
    const network = networks_1.networks[selectedNetwork];
    const tx = bitcoin.Transaction.fromHex(txhex);
    const txb = bitcoin.TransactionBuilder.fromTransaction(tx, network);
    const key = bitcoin.ECPair.fromWIF(privkey, network);
    for (let i = 0; i < inputs.length; i++) {
        txb.sign({
            prevOutScriptType: 'p2pkh',
            vin: i,
            keyPair: key,
        });
    }
    return txb.build().toHex();
};
exports.generateFundingAddress = async ({ index = 0, mnemonic, selectedNetwork, }) => {
    const coinType = selectedNetwork === 'bitcoinTestnet' ? '1' : '0';
    const addressPath = `m/44'/${coinType}'/0'/0/${index}`;
    const seed = bip39.mnemonicToSeedSync(mnemonic, '');
    const network = networks_1.networks[selectedNetwork];
    const root = bip32.fromSeed(seed, network);
    const addressKeypair = root.derivePath(addressPath);
    const address = exports.getAddress({
        keyPair: addressKeypair,
        network,
    });
    const scriptHash = exports.getScriptHash(address, network);
    return result_1.ok({
        index,
        path: addressPath,
        address,
        scriptHash,
        publicKey: addressKeypair.publicKey.toString('hex'),
    });
};
exports.signP2SH = async ({ is_first_sign, txhex, pubkey_1, pubkey_2, privkey, inputs, selectedNetwork = 'bitcoin', }) => {
    if (txhex === '') {
        return '';
    }
    const network = networks_1.networks[selectedNetwork];
    const tx = bitcoin.Transaction.fromHex(txhex);
    const txb = bitcoin.TransactionBuilder.fromTransaction(tx, network);
    const pubkeys = [pubkey_1, pubkey_2].map((hex) => Buffer.from(hex, 'hex'));
    const p2ms = bitcoin.payments.p2ms({ m: 2, pubkeys, network });
    const p2sh = bitcoin.payments.p2sh({ redeem: p2ms, network });
    const key = bitcoin.ECPair.fromWIF(privkey, network);
    for (let i = 0; i < inputs.length; i++) {
        let amount = exports.accMul(inputs[i].amount, 100000000);
        txb.sign(i, key, p2sh.redeem.output, undefined, amount, undefined);
    }
    if (is_first_sign === true) {
        let firstHex = txb.buildIncomplete().toHex();
        console.info('First signed - Hex => ' + firstHex);
        return firstHex;
    }
    else {
        let finalHex = txb.build().toHex();
        console.info('signP2SH - Second signed - Hex = ' + finalHex);
        return finalHex;
    }
};
exports.accMul = (arg1, arg2) => {
    let m = 0, s1 = arg1.toString(), s2 = arg2.toString();
    try {
        m += s1.split('.')[1].length;
    }
    catch (e) { }
    try {
        m += s2.split('.')[1].length;
    }
    catch (e) { }
    return ((Number(s1.replace('.', '')) * Number(s2.replace('.', ''))) /
        Math.pow(10, m));
};
exports.promiseTimeout = (ms, promise) => {
    let id;
    let timeout = new Promise((resolve) => {
        id = setTimeout(() => {
            resolve(result_1.err('Timed Out.'));
        }, ms);
    });
    return Promise.race([promise, timeout]).then((result) => {
        clearTimeout(id);
        try {
            if (result?.isErr()) {
                return result_1.err(result?.error?.message);
            }
        }
        catch (e) {
            return result_1.err(e);
        }
        return result;
    });
};
exports.sleep = (ms = 1000) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
};
exports.parseOmniboltUri = (uri) => {
    try {
        if (!uri) {
            return result_1.err('No URI provided.');
        }
        let action;
        const isOmniboltUri = uri.substr(0, 9) === 'omnibolt:';
        if (!isOmniboltUri)
            return result_1.err('This is not an omnibolt uri.');
        uri = uri.substr(9, uri.length);
        const actionIndex = uri.indexOf(':');
        action = uri.substr(0, actionIndex);
        const data = JSON.parse(uri.substr(actionIndex + 1, uri.length));
        return result_1.ok({
            action,
            data,
        });
    }
    catch (e) {
        return result_1.err(e);
    }
};
exports.generateOmniboltUri = ({ action, data }) => {
    try {
        if (!action || !data)
            return result_1.err('Unable to generate omnibolt uri.');
        if (typeof data !== 'string') {
            data = JSON.stringify(data);
        }
        return result_1.ok(`omnibolt:${action}:${data}`);
    }
    catch (e) {
        return result_1.err(e);
    }
};
//# sourceMappingURL=index.js.map