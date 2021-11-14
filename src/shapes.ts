import { IChannelSigningData, IData } from './types';

export const addressContent = {
	index: 0,
	path: '',
	address: '',
	scriptHash: '',
	publicKey: '',
};

export const defaultDataShape: IData = {
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

export const channelSigningData: IChannelSigningData = {
	fundingAddress: { ...addressContent },
	addressIndex: { ...addressContent },
	last_temp_address: { ...addressContent },
	rsmc_temp_address: { ...addressContent },
	htlc_temp_address: { ...addressContent },
	htlc_temp_address_for_he1b: { ...addressContent },
	kTbSignedHex: '',
	funding_txid: '',
	kTempPrivKey: '',
	kTbSignedHexCR110351: '',
	kTbSignedHexRR110351: '',
	kTbTempData: '',
};
