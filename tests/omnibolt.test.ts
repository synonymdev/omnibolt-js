import * as chai from 'chai';
import { ObdApi } from '../src';
import WebSocket from 'ws';
import {
	assetInformation,
	channelInfo,
	connectionInfo,
	data,
	fundingAddresses,
	loginPhrase,
	mnemonic,
	nodeAddress,
	propertyId,
	saveData,
	selectedNetwork,
	url,
	userPeerId
} from './constants';

const expect = chai.expect;
let obdapi: ObdApi;

describe('omnibolt-js Library', () => {

	it('Should create an obdapi instance' , async () => {
		obdapi = new ObdApi({ websocket: WebSocket });
		expect(obdapi).to.be.a('object');
		expect(obdapi.selectedNetwork).to.deep.equal(selectedNetwork);
	});

	it('Should connect and login to an obd server.' , async () => {
		const response = await obdapi.connect({
			loginPhrase,
			mnemonic,
			url,
			selectedNetwork,
			saveData,
			data,
		});
		expect(response.isOk()).to.equal(true);
		if (response.isErr()) return;
		expect(response.value.userPeerId).to.deep.equal(userPeerId);
		expect(response.value.nodeAddress).to.deep.equal(nodeAddress);
	});

	it('Should return connection info.' , async () => {
		const response = await obdapi.getInfo();
		expect(response).to.deep.equal(connectionInfo);
	});

	it('Should return connect uri string.' , async () => {
		const response = await obdapi.getConnectUri();
		expect(response.isOk()).to.equal(true);
		if (response.isErr()) return;
		const connectUriData = JSON.stringify({ remote_node_address: obdapi.loginData.nodeAddress, recipient_user_peer_id: obdapi.loginData.userPeerId });
		expect(response.value).to.deep.equal(`omnibolt:connect:${connectUriData}`);
	});

	const getFundingAddressTest = async (index): Promise<void> => {
		const response = await obdapi.getFundingAddress({ index });
		expect(response.isOk()).to.equal(true);
		if (response.isErr()) return;
		const fundingAddress = fundingAddresses[index];
		expect(response.value).to.deep.equal(fundingAddress);
	};

	it('Should return funding address at index zero' , async () => {
		await getFundingAddressTest(0);
	});

	it('Should return funding address at index one' , async () => {
		await getFundingAddressTest(1);
	});

	it('Should return available channels' , async () => {
		const response = await obdapi.getMyChannels();
		expect(response.isOk()).to.equal(true);
		if (response.isErr()) return;
		expect(response.value.data).to.be.a('array');
		const responseData = response.value.data[0];
		expect(responseData).to.deep.equal(channelInfo);
	});

	it('Should return asset/property information' , async () => {
		let response = await obdapi.getProperty(propertyId);
		expect(response.isOk()).to.equal(true);
		if (response.isErr()) return;
		expect(response.value).to.deep.equal(assetInformation);
	});
});
