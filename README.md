# omnibolt-js

## ⚠️ Warning
This is pre-alpha software and only intended for use on Bitcoin Testnet. Please use at your own risk. Expect breaking changes.

## ⚙️ Installation

```
yarn add https://github.com/synonymdev/omnibolt-js.git

or

npm i -S https://github.com/synonymdev/omnibolt-js.git
```

## ⚡️ Setup & Usage

##### Setup & Connect To Omnibolt

```
import { ObdApi } from "omnibolt-js";
import { defaultDataShape } from "omnibolt-js/lib/shapes.js";
import storage from 'node-persist';
import WebSocket from 'ws';

await storage.init();

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

const selectedNetwork = 'bitcoinTestnet'; //'bitcoin' | 'bitcoinTestnet'

/*
This is used to save the address signing data.
It keeps track of funds and the next available
addresses for signing.
*/
const saveData = async (data) => {
    await storage.setItem('omnibolt', JSON.stringify(data));
    console.log('Data saved...', data);
};

/*
This method is used to retrieve the previously stored
data from the "saveData" method in your application.
If no data is available, just pass in an empty object {} or the defaultDataShape object.
*/
const getData = async (key = 'omnibolt') => {
    try {
    	return JSON.parse(await storage.getItem(key)) ?? { ...defaultDataShape };
    } catch {
    	return { ...defaultDataShape };
    }
}

// Retrieve data, if any.
const data = await getData();

// Create OBD instance.
const obdapi = new ObdApi({ websocket: WebSocket });

// Connect to the specified server and setup env params.
const connectResponse = await obdapi.connect({
    loginPhrase,
    mnemonic,
    url,
    selectedNetwork,
    saveData,
    data,
});
if (connectResponse.isErr()) {
    console.log(connectResponse.error.message);
    return;
}
```

##### Get Connection Info
```
const info = obdapi.getInfo();
```

##### Get Funding Address
This is the address used to fund a given channel with Bitcoin and Omni assets.
```
const fundingAddress = await obdapi.getFundingAddress({ index: 0 });
```

##### Open Channel
```
// We first need to connect to a peer.
const connectPeerResponse: Result<string> = await obdapi.connectPeer({remote_node_address});
if (connectPeerResponse.isErr()) {
    console.log(`Unable to connect to ${remote_node_address}.`);
    return;
}

// Once connected we can initiate a channel open.
const info: OpenChannelInfo = {
    funding_pubkey,
    is_private,
};
obdapi.openChannel(
    recipient_node_peer_id,
    recipient_user_peer_id,
    info,
);
```

##### Fund Channel
 - TODO

##### Get Omnibolt Channels
```
const channelResponse = await obdapi.getMyChannels();
```

##### Send Asset
```
await obdapi.sendOmniAsset({
    channelId,
    amount,
    recipient_node_peer_id,
    recipient_user_peer_id,
});
```

##### Close Channel
```
await obdapi.closeChannel(
    recipient_node_peer_id,
    recipient_user_peer_id,
    channelId,
);
```

##### Get Asset Info By ID
```
const id = '137';
const assetInfo = await obdapi.getProperty(id);
```

### 📖 API Documentation

 - https://api.omnilab.online/
 
### 🤖 Debugging Tool

 - https://github.com/omnilaboratory/DebuggingTool/
           
### 📝️ License [MIT](https://github.com/synonymdev/omnibolt-js/blob/master/LICENSE)
