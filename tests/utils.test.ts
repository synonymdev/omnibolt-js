import { generateOmniboltUri, parseOmniboltUri } from '../src/utils';

import * as chai from 'chai';
import { omniboltConnectString, omniboltConnectUri } from './constants';
const expect = chai.expect;


describe('Utils/Helper Methods', () => {

	it('Should parse an omnibolt connect uri' , async () => {
		const response = parseOmniboltUri(omniboltConnectString);
		expect(response.isOk()).to.deep.equal(true);
		if (response.isErr()) return;
		expect(response.value.action).to.deep.equal(omniboltConnectUri.action);
		expect(JSON.stringify(response.value.data)).to.deep.equal(omniboltConnectUri.data);
	});

	it('Should generate an omnibolt connect uri' , async () => {
		const response = generateOmniboltUri({ action: omniboltConnectUri.action, data: omniboltConnectUri.data });
		expect(response.isOk()).to.deep.equal(true);
		if (response.isErr()) return;
		expect(response.value).to.deep.equal(omniboltConnectString);
	});

});
