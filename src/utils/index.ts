/**
 * This method adds a new omnibolt address based on the previous address index.
 * @param {string} [selectedWallet]
 * @param {TAvailableNetworks} [selectedNetwork]
 */
import { err, ok, Result } from '../result';
import {
	IAddressContent,
	IGenerateOmniboltUri,
	IGetAddress,
	IParseOmniboltUriResponse,
	ISignP2PKH,
	ISignP2SH,
	TAvailableNetworks
} from '../types';
import { INetwork, networks } from './networks';

const bitcoin = require('bitcoinjs-lib');
const bip39 = require('bip39');
const bip32 = require('bip32');

/**
 * This method returns a new omnibolt address based on the previous address index.
 * @async
 * @param {string} [selectedWallet]
 * @param {TAvailableNetworks} [selectedNetwork]
 * @return {<Promise<Result<IAddressContent>>>}
 */
export const getNextOmniboltAddress = async ({
	selectedNetwork,
	addressIndex,
	mnemonic,
}: {
  selectedNetwork: TAvailableNetworks;
  addressIndex: IAddressContent;
  mnemonic: string;
}): Promise<Result<IAddressContent>> => {
	let index = 0;
	if (
		addressIndex &&
    addressIndex?.index >= 0 &&
    addressIndex?.path?.length > 0
	) {
		index = addressIndex.index + 1;
	}
	//`m/${purpose}'/${coinType}'/${account}'/${change}/${addressIndex}`
	const coinType = selectedNetwork === 'bitcoinTestnet' ? '1' : '0';
	const addressPath = `m/44'/${coinType}'/2'/0/${index}`;
	const seed = bip39.mnemonicToSeedSync(mnemonic, '');
	const network = networks[selectedNetwork];
	const root = bip32.fromSeed(seed, network);
	const addressKeypair = root.derivePath(addressPath);
	const address = getAddress({
		keyPair: addressKeypair,
		network,
	});
	const scriptHash = getScriptHash(address, network);
	return ok({
		index,
		path: addressPath,
		address,
		scriptHash,
		publicKey: addressKeypair.publicKey.toString('hex'),
	});
};

/**
 * Get address for a given keyPair, network and type.
 * @param {Object|undefined} keyPair
 * @param {string|Object|undefined} network
 * @param {string} type - Determines what type of address to generate (legacy, segwit, bech32).
 * @return {string}
 */
export const getAddress = ({
	keyPair = undefined,
	network = undefined,
	type = 'legacy',
}: IGetAddress): string => {
	if (!keyPair || !network) {
		return '';
	}
	try {
		switch (type) {
			case 'bech32':
				//Get Native Bech32 (bc1) addresses
				return bitcoin.payments.p2wpkh({ pubkey: keyPair.publicKey, network })
					.address;
			case 'segwit':
				//Get Segwit P2SH Address (3)
				return bitcoin.payments.p2sh({
					redeem: bitcoin.payments.p2wpkh({
						pubkey: keyPair.publicKey,
						network,
					}),
					network,
				}).address;
				//Get Legacy Address (1)
			case 'legacy':
				return bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey, network })
					.address;
		}
		return '';
	} catch {
		return '';
	}
};

/**
 * Get scriptHash for a given address
 * @param {string} address
 * @param {string|Object} network
 * @return {string}
 */
export const getScriptHash = (
	address = '',
	network: INetwork | string = networks.bitcoin,
): string => {
	try {
		if (!address || !network) {
			return '';
		}
		if (typeof network === 'string' && network in networks) {
			network = networks[network];
		}
		const script = bitcoin.address.toOutputScript(address, network);
		let hash = bitcoin.crypto.sha256(script);
		const reversedHash = Buffer.from(hash.reverse());
		return reversedHash.toString('hex');
	} catch {
		return '';
	}
};

/**
 * Returns private key for the provided address data.
 * @param {IAddressContent} addressData
 * @param {string} [selectedWallet]
 * @param {TAvailableNetworks} [selectedNetwork]
 * @return {Promise<Result<string>>}
 */
export const getPrivateKey = async ({
	addressData,
	selectedNetwork = 'bitcoin',
	mnemonic,
}: {
  addressData: IAddressContent;
  selectedNetwork?: TAvailableNetworks;
  mnemonic: string;
}): Promise<Result<string>> => {
	try {
		if (!addressData) {
			return err('No addressContent specified.');
		}
		if (!mnemonic) {
			return err('No mnemonic phrase specified.');
		}
		const network = networks[selectedNetwork];
		const bip39Passphrase = '';
		const seed = bip39.mnemonicToSeedSync(mnemonic, bip39Passphrase);
		const root = bip32.fromSeed(seed, network);

		const addressPath = addressData.path;
		const addressKeypair = root.derivePath(addressPath);
		return ok(addressKeypair.toWIF());
	} catch (e) {
		return err(e);
	}
};

/**
 * Sign P2PKH address with TransactionBuilder way
 * main network: btctool.bitcoin.networks.bitcoin;
 * @param txhex
 * @param privkey
 * @param inputs    all of inputs
 * @param selectedNetwork
 */

export const signP2PKH = ({ txhex, privkey, inputs, selectedNetwork = 'bitcoin' }: ISignP2PKH): string => {
	if (txhex === '') return '';
	const network = networks[selectedNetwork];
	const tx      = bitcoin.Transaction.fromHex(txhex);
	const txb     = bitcoin.TransactionBuilder.fromTransaction(tx, network);
	const key     = bitcoin.ECPair.fromWIF(privkey, network);

	// Sign all inputs
	for (let i = 0; i < inputs.length; i++) {
		txb.sign({
			prevOutScriptType: 'p2pkh',
			vin: i,
			keyPair: key,
		});
	}

	// Return hex
	return txb.build().toHex();
};

/**
 * This method returns a funding address based on the provided index.
 * @async
 * @param {number} index
 * @param {string} mnemonic
 * @param {TAvailableNetworks} [selectedNetwork]
 * @return {<Promise<Result<IAddressContent>>>}
 */
export const generateFundingAddress = async ({
	index = 0,
	mnemonic,
	selectedNetwork,
}: {
	index: number;
	mnemonic: string;
	selectedNetwork: TAvailableNetworks;
}): Promise<Result<IAddressContent>> => {
	//`m/${purpose}'/${coinType}'/${account}'/${change}/${addressIndex}`
	const coinType = selectedNetwork === 'bitcoinTestnet' ? '1' : '0';
	const addressPath = `m/44'/${coinType}'/0'/0/${index}`;
	const seed = bip39.mnemonicToSeedSync(mnemonic, '');
	const network = networks[selectedNetwork];
	const root = bip32.fromSeed(seed, network);
	const addressKeypair = root.derivePath(addressPath);
	const address = getAddress({
		keyPair: addressKeypair,
		network,
	});
	const scriptHash = getScriptHash(address, network);
	return ok({
		index,
		path: addressPath,
		address,
		scriptHash,
		publicKey: addressKeypair.publicKey.toString('hex'),
	});
};

/**
 * Sign P2SH address with TransactionBuilder way for 2-2 multi-sig address
 * @param is_first_sign  Is the first person to sign this transaction?
 * @param txhex
 * @param pubkey_1
 * @param pubkey_2
 * @param privkey
 * @param inputs    all of inputs
 * @param selectedNetwork
 */
//TODO: Remove TransactionBuilder and work into existing signing logic.
export const signP2SH = async ({
	is_first_sign,
	txhex,
	pubkey_1,
	pubkey_2,
	privkey,
	inputs,
	selectedNetwork = 'bitcoin',
}: ISignP2SH): Promise<string> => {
	if (txhex === '') {
		return '';
	}
	const network = networks[selectedNetwork];
	const tx = bitcoin.Transaction.fromHex(txhex);
	const txb = bitcoin.TransactionBuilder.fromTransaction(tx, network);
	const pubkeys = [pubkey_1, pubkey_2].map((hex) => Buffer.from(hex, 'hex'));
	const p2ms = bitcoin.payments.p2ms({ m: 2, pubkeys, network });
	const p2sh = bitcoin.payments.p2sh({ redeem: p2ms, network });
	// private key
	const key = bitcoin.ECPair.fromWIF(privkey, network);

	// Sign all inputs
	for (let i = 0; i < inputs.length; i++) {
		let amount = accMul(inputs[i].amount, 100000000);
		txb.sign(i, key, p2sh.redeem.output, undefined, amount, undefined);
	}

	if (is_first_sign === true) {
		// The first person to sign this transaction
		let firstHex = txb.buildIncomplete().toHex();
		console.info('First signed - Hex => ' + firstHex);
		return firstHex;
	} else {
		// The second person to sign this transaction
		let finalHex = txb.build().toHex();
		console.info('signP2SH - Second signed - Hex = ' + finalHex);
		return finalHex;
	}
};

/**accMul
 * This function is used to get accurate multiplication result.
 *
 * Explanation: There will be errors in the multiplication result of javascript,
 * which is more obvious when multiplying two floating-point numbers.
 * This function returns a more accurate multiplication result.
 *
 * @param arg1
 * @param arg2
 */
export const accMul = (arg1, arg2): number => {
	let m = 0,
		s1 = arg1.toString(),
		s2 = arg2.toString();

	try {
		m += s1.split('.')[1].length;
	} catch (e) {}

	try {
		m += s2.split('.')[1].length;
	} catch (e) {}

	return (
		(Number(s1.replace('.', '')) * Number(s2.replace('.', ''))) /
    Math.pow(10, m)
	);
};

/**
 * Used to timeout a request after a specified period of time.
 * @param {number} ms
 * @param {Promise<any>} promise
 * @return {Promise<any>}
 */
export const promiseTimeout = (
	ms: number,
	promise: Promise<any>,
): Promise<any> => {
	let id;
	let timeout = new Promise((resolve) => {
		id = setTimeout(() => {
			resolve(err('Timed Out.'));
		}, ms);
	});
	return Promise.race([promise, timeout]).then((result) => {
		clearTimeout(id);
		try {
			if (result?.isErr()) {
				return err(result?.error?.message);
			}
		} catch (e) {
			return err(e);
		}
		return result;
	});
};

export const sleep = (ms = 1000): Promise<void> => {
	return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Parses an omnibolt uri, returning the specified action and data provided.
 * Example: omnibolt:connect:{"remote_node_address":"nodeAddress","recipient_user_peer_id":"userId"}
 * @param {string} uri
 */
export const parseOmniboltUri = (uri: string): Result<IParseOmniboltUriResponse> => {
	try {
		if (!uri) {
			return err('No URI provided.');
		}
		let action;
		const isOmniboltUri = uri.substr(0,9) === 'omnibolt:';
		if (!isOmniboltUri) return err('This is not an omnibolt uri.');
		uri = uri.substr(9, uri.length);
		const actionIndex = uri.indexOf(':');
		action = uri.substr(0, actionIndex);
		const data = JSON.parse(uri.substr(actionIndex+1, uri.length));
		return ok({
			action,
			data,
		});
	} catch (e) {
		return err(e);
	}
};

/**
 * Generates an omnibolt uri where specific omnibolt actions and data can be specified for easier sharing.
 * @param {string} action
 * @param {string|object} data
 * @return {Result<string>}
 */
export const generateOmniboltUri = ({ action, data }: IGenerateOmniboltUri): Result<string> => {
	try {
		if (!action || !data) return err('Unable to generate omnibolt uri.');
		if (typeof data !== 'string') {
			data = JSON.stringify(data);
		}
		return ok(`omnibolt:${action}:${data}`);
	} catch (e) {
		return err(e);
	}
};
