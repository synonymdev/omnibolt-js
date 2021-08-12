# omnibolt-js


## ⚙️ Installation

```
yarn add git+ssh://git@github.com/synonymdev/omnibolt-js

or

npm i -S git+ssh://git@github.com/synonymdev/omnibolt-js
```

## ⚡️ Setup & Usage

##### Setup & Connect To Omnibolt Server

```
import { ObdApi } from "omnibolt-js";

// This is the passphrase used to login to the omnibolt server.
const loginPhrase = 'snow evidence basic rally wing flock room mountain monitor page sail betray steel major fall pioneer summer tenant pact bargain lucky joy lab parrot';

/*
This is the mnemonic phrase used for signing and transferring
assets and should be stored securely and seperately
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
const saveData = async (data: ISaveData) => {
    await AsyncStorage.setItem('omnibolt', JSON.stringify(data));
    console.log('Data saved...', data);
};

/*
This method is used to retrive the previously stored
data from the "saveData" method in your application.
If no data is available, just pass in an empty object {}
*/
const getData = async (key = 'omnibolt'): Promise<ISaveData> => {
    try {
        return JSON.parse(await AsyncStorage.getItem(key)) ?? {};
    } catch {
        return {}
    }
}

// Retrieve data, if any.
const data = await getData();

const obdapi: ObdApi = new ObdApi({ loginPhrase, mnemonic, url, selectedNetwork, saveData, data });
const connectResponse: Result<IConnect> = await obdapi.connect();
```

##### Get Connection Info
```
const info = obdapi.getInfo();
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
const channelResponse: Result<IGetMyChannels> = await obdapi.getMyChannels();
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
await obdapi.getProperty(id);
```

### 📖 API Documentation

 - https://api.omnilab.online/
 
### 🤖 Debugging Tool

 - https://github.com/omnilaboratory/DebuggingTool/
           
### ⚠️ License [MIT](https://github.com/synonymdev/omnibolt-js/blob/master/LICENSE)
