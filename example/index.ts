import { ObdApi } from '../src';
import { defaultDataShape } from '../src/shapes';
import storage from 'node-persist';
import WebSocket from 'ws';
import { ISaveData } from '../lib/types/types';
import { parseOmniboltUri } from '../src/utils';

storage.init().then(async (): Promise<void> => {
	// This is the passphrase used to login to the omnibolt server.
	const loginPhrase = 'snow evidence basic rally wing flock room mountain monitor page sail betray steel major fall pioneer summer tenant pact bargain lucky joy lab parrot';

	/*
	This is the mnemonic phrase used for signing and transferring
	assets and should be stored securely and separately
	from the other data.
	*/
	const mnemonic = 'table panda praise oyster benefit ticket bonus capital silly burger fatal use oyster cream feel wine trap focus planet sail atom approve album valid';

	// Omnibolt server to connect to.
	const url = '62.234.216.108:60020/wstest';

	const selectedNetwork: 'bitcoin' | 'bitcoinTestnet' = 'bitcoinTestnet';

	/*
	This is used to save the address signing data.
	It keeps track of funds and the next available
	addresses for signing.
	*/
	const saveData = async (data: ISaveData): Promise<void> => {
		await storage.setItem('omnibolt', JSON.stringify(data));
		console.log('Data saved...', data);
	};

	/*
	This method is used to retrieve the previously stored
	data from the "saveData" method in your application.
	If no data is available, just pass in an empty object {}
	*/
	const getData = async (key = 'omnibolt'): Promise<ISaveData> => {
		try {
			return JSON.parse(await storage.getItem(key)) ?? { ...defaultDataShape };
		} catch {
			return { ...defaultDataShape };
		}
	};

	// Retrieve data, if any.
	const data = await getData();

	const obdapi: ObdApi = new ObdApi({ websocket: WebSocket });
	const connectResponse = await obdapi.connect({
		loginPhrase,
		mnemonic,
		url,
		selectedNetwork,
		saveData,
		data,
	});
	if (connectResponse.isErr()) {
		console.log('connectResponse error', connectResponse.error.message);
		return;
	}
	console.log('connectResponse', connectResponse.value);
	console.log('\n');

	// Get connection info
	const getInfoResponse = obdapi.getInfo();
	console.log('getInfoResponse', getInfoResponse);
	console.log('\n');

	// Retrieve omnibolt funding address
	const fundingAddress = await obdapi.getFundingAddress({});
	if (fundingAddress.isErr()) {
		console.log('fundingAddress error', fundingAddress.error.message);
		return;
	}
	console.log('fundingAddress', fundingAddress);
	console.log('\n');

	// Get available channels
	const channelResponse = await obdapi.getMyChannels();
	if (channelResponse.isErr()) {
		console.log('channelResponse error', channelResponse.error.message);
		return;
	}
	console.log('channelResponse', channelResponse.value);
	console.log('\n');

	// Get asset info
	const id = '137';
	const assetInfoResponse = await obdapi.getProperty(id);
	if (assetInfoResponse.isErr()) {
		console.log('assetInfoResponse error', assetInfoResponse.error.message);
		return;
	}
	console.log('assetInfoResponse', assetInfoResponse.value);
	console.log('\n');

	const getConnectUriResponse = obdapi.getConnectUri();
	if (getConnectUriResponse.isErr()) {
		console.log('getConnectStringResponse error', getConnectUriResponse.error.message);
		return;
	}
	console.log('getConnectStringResponse', getConnectUriResponse.value);
	console.log('\n');

	const parseOmniboltUriResponse = parseOmniboltUri(getConnectUriResponse.value);
	if (parseOmniboltUriResponse.isErr()) {
		console.log('parseOmniboltUriResponse error', parseOmniboltUriResponse.error.message);
		return;
	}
	console.log('parseOmniboltUriResponse', parseOmniboltUriResponse.value);
	console.log('\n');

	const getAllBalancesForAddressResponse = await obdapi.getAllBalancesForAddress(fundingAddress.value.address);
	if (getAllBalancesForAddressResponse.isErr()) {
		console.log('getAllBalancesForAddressResponse error', getAllBalancesForAddressResponse.error.message);
		return;
	}
	console.log('getAllBalancesForAddressResponse', getAllBalancesForAddressResponse.value);
	console.log('\n');

	const getTransactionResponse = await obdapi.getTransaction('a04a7a285e636ebf013ceec94748ee9dbe8d3d72f64a53cc12fcbc36d45fce2f');
	if (getTransactionResponse.isErr()) {
		console.log('getTransactionResponse error', getTransactionResponse.error.message);
		return;
	}
	console.log('getTransactionResponse', getTransactionResponse.value);
	console.log('\n');
});
