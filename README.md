# omnibolt-js

## ⚠️ Warning
This is pre-alpha software and only intended for use on Bitcoin Testnet. Please use at your own risk. Expect breaking changes.

- [⚙️ Installation](#---installation)
- [⚡️ Setup & Connect](#---setup---connect)
- [🧰 Methods](#---methods)
    * [Get Connection Info (obdapi.getInfo)](#get-connection-info)
    * [Get Funding Address (obdapi.getFundingAddress)](#get-funding-address)
    * [Create Channel (obdapi.createChannel)](#create-channel)
    * [Get Omnibolt Channels (obdapi.getMyChannels)](#get-omnibolt-channels)
    * [Send Asset (obdapi.sendOmniAsset)](#send-asset)
    * [Close Channel (obdapi.closeChannel)](#close-channel)
    * [Get Asset Info By ID (obdapi.getProperty)](#get-asset-info-by-id)
- [📖 API Documentation](#---api-documentation)
- [🤖 Debugging Tool](#---debugging-tool)
- [📝️ License [MIT]](#----license--mit--https---githubcom-synonymdev-omnibolt-js-blob-master-license-)


## ⚙️ Installation

```
yarn add https://github.com/synonymdev/omnibolt-js.git

or

npm i -S https://github.com/synonymdev/omnibolt-js.git
```

## ⚡️ Setup & Connect

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

## 🧰 Methods

##### Get Connection Info
```
const info = obdapi.getInfo();
```

##### Get Funding Address
This is the address used to fund a given channel with Bitcoin and Omni assets.
```
const fundingAddress = await obdapi.getFundingAddress({ index: 0 });
```

##### Create Channel
There are three pre-requisites to successfully create, fund and open an omnibolt channel:
  1. The peer you're attempting to open a channel with must be online.
  2. The funding address must have a sufficient Bitcoin balance in order to cover the fees for channel opening (amount_to_fund + miner_fee) * 3.
  3. The funding address must have a balance of the specified omni asset (`asset_id`) greater than the amount you intend to create a channel with (`asset_amount`).

In the following example, we're assuming that the `fundingAddressIndex` of 0 has a Bitcoin balance greater than (0.0001 + 0.00005) * 3 and an omni asset balance >= 5.
```
const createChannelResponse = await obdapi.createChannel({
    remote_node_address,
    recipient_user_peer_id,
    info: {
        fundingAddressIndex: 0,
        asset_id: 137,
        asset_amount: 5,
        amount_to_fund: 0.0001,
        miner_fee: 0.00005,
    },
});
if (createChannelResponse.isErr()) {
    console.log(createChannelResponse.error.message);
} else {
    console.log(createChannelResponse.value);    
}
```

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
