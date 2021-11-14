"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.channelSigningData = exports.defaultDataShape = exports.addressContent = void 0;
exports.addressContent = {
    index: 0,
    path: '',
    address: '',
    scriptHash: '',
    publicKey: '',
};
exports.defaultDataShape = {
    nextAddressIndex: {
        index: 0,
        path: '',
        address: '',
        scriptHash: '',
        publicKey: '',
    },
    signingData: {},
    checkpoints: {},
    fundingAddresses: {},
};
exports.channelSigningData = {
    fundingAddress: { ...exports.addressContent },
    addressIndex: { ...exports.addressContent },
    last_temp_address: { ...exports.addressContent },
    rsmc_temp_address: { ...exports.addressContent },
    htlc_temp_address: { ...exports.addressContent },
    htlc_temp_address_for_he1b: { ...exports.addressContent },
    kTbSignedHex: '',
    funding_txid: '',
    kTempPrivKey: '',
    kTbSignedHexCR110351: '',
    kTbSignedHexRR110351: '',
};
