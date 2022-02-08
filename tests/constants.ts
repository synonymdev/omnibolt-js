import { defaultDataShape } from '../src/shapes';

export const loginPhrase = 'snow evidence basic rally wing flock room mountain monitor page sail betray steel major fall pioneer summer tenant pact bargain lucky joy lab parrot';
export const mnemonic = 'table panda praise oyster benefit ticket bonus capital silly burger fatal use oyster cream feel wine trap focus planet sail atom approve album valid';
export const url = '62.234.216.108:60020/wstest';
export const selectedNetwork = 'bitcoinTestnet';
export const userPeerId = '6a3cff12cb9d7a18333900ca0e5fe4dcf3e7414e184db6e8cf980203b1dfe44e';
export const nodeAddress = '/ip4/62.234.216.108/tcp/4001/p2p/QmaYAYp4MzkncRUvZgwDc4DLDbKfWftftoUiZSjnRz2ABy';
export const nodePeerId = 'QmaYAYp4MzkncRUvZgwDc4DLDbKfWftftoUiZSjnRz2ABy';
export const propertyId = '137';

export const omniboltConnectUri = {
	action: 'connect',
	data: '{"remote_node_address":"/ip4/62.234.216.108/tcp/4001/p2p/QmaYAYp4MzkncRUvZgwDc4DLDbKfWftftoUiZSjnRz2ABy","recipient_user_peer_id":"6a3cff12cb9d7a18333900ca0e5fe4dcf3e7414e184db6e8cf980203b1dfe44e"}',
};
export const omniboltConnectString = `omnibolt:${omniboltConnectUri.action}:${omniboltConnectUri.data}`;

export const saveData = async (): Promise<void> => {};
export const data = defaultDataShape;

export const connectionInfo = {
	chainNodeType: 'test',
	htlcFeeRate: 0.0001,
	htlcMaxFee: 0.01,
	nodeAddress: '/ip4/62.234.216.108/tcp/4001/p2p/QmaYAYp4MzkncRUvZgwDc4DLDbKfWftftoUiZSjnRz2ABy',
	nodePeerId: 'QmaYAYp4MzkncRUvZgwDc4DLDbKfWftftoUiZSjnRz2ABy',
	userPeerId: '6a3cff12cb9d7a18333900ca0e5fe4dcf3e7414e184db6e8cf980203b1dfe44e',
};
export const fundingAddresses = [
	{
		index: 0,
		address: 'mypLwE2kcywW4cTHKmBGDPwULogb8PaKJP',
		path: "m/44'/1'/0'/0/0",
		publicKey: '022f16ad3c05a43782e59b23349c3cb3b04a99c744220de1fd8a345de93a2fc652',
		scriptHash: 'cba28cd77d770590f60db0c75d3c8be41333a476a09e427ed0a14d5ba3552b94',
	},
	{
		index: 1,
		address: 'mfd5H88MafMHdYViR38nQNZYkB4m8QtFw1',
		path: "m/44'/1'/0'/0/1",
		publicKey: '035a600bf65844c49186b766233cc078c85b0b88c53fe56c9871375cae9c7d9173',
		scriptHash: '7621403c2a1d020a2025409081afe33ab0fb90e36d72e8c9b88a2fc4fb5ef7de',
	}
];
export const channelInfo = {
	asset_amount: 5,
	balance_a: 2,
	balance_b: 3,
	balance_htlc: 0,
	btc_amount: 0.00009296,
	btc_funding_times: 3,
	channel_address: '2N1pt9VG7wvoWye3aN1PuEvggmVTkn9XQTF',
	channel_id: "186456df442b8a43342ea64236d1e8f3a7e59b8e84081bda32babd91b8ab7a1a",
	create_at: '2022-02-02T03:40:52.263387548+08:00',
	curr_state: 20,
	is_private: false,
	peer_ida: '677169d8d2113d36a15143d46ae6db33003ad6399f295bb4586a1d91c6bb622a',
	peer_idb: '6a3cff12cb9d7a18333900ca0e5fe4dcf3e7414e184db6e8cf980203b1dfe44e',
	property_id: 137,
	temporary_channel_id: '4f99546eb2f9b19b92412d7717d66e7451ae9751a203d9b9d20d7650a5ffa8c8',
};
export const assetInformation = {
	category: '',
	creationtxid: 'a04a7a285e636ebf013ceec94748ee9dbe8d3d72f64a53cc12fcbc36d45fce2f',
	data: 'OBD Test Token NO.1',
	divisible: true,
	fixedissuance: true,
	issuer: 'n4j37pAMNsjkTs6roKof3TGNvmPh16fvpS',
	managedissuance: false,
	name: 'OBD-1',
	propertyid: 137,
	subcategory: '',
	totaltokens: '10000000000.00000000',
	url: ''
};

export const fundingAddressBalanceInfo = [
	{
		balance: '65.00000000',
		frozen: '0.00000000',
		name: 'OBD-1',
		propertyid: 137,
		reserved: '0.00000000'
	}
];

export const getTransactionResponse = {
	amount: '10000000000.00000000',
	block: 1746496,
	blockhash: '00000000c475a61b682018a9d7b7d64ab58c6e46be865eedb00e8ad6d91ed6a8',
	blocktime: 1590400679,
	category: '',
	confirmations: 393735,
	data: 'OBD Test Token NO.1',
	divisible: true,
	ecosystem: 'main',
	fee: '0.00000254',
	ismine: true,
	positioninblock: 147,
	propertyid: 137,
	propertyname: 'OBD-1',
	propertytype: 'divisible',
	sendingaddress: 'n4j37pAMNsjkTs6roKof3TGNvmPh16fvpS',
	subcategory: '',
	txid: 'a04a7a285e636ebf013ceec94748ee9dbe8d3d72f64a53cc12fcbc36d45fce2f',
	type: 'Create Property - Fixed',
	type_int: 50,
	url: '',
	valid: true,
	version: 0
};
