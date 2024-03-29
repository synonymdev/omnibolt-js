"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pojo_1 = require("./pojo");
const result_1 = require("./result");
const utils_1 = require("./utils");
const shapes_1 = require("./shapes");
const browser_or_node_1 = require("./utils/browser-or-node");
const DEFAULT_URL = '62.234.216.108:60020/wstest';
class ObdApi {
    constructor({ websocket, verbose = false, } = {}) {
        this.isConnectedToOBD = false;
        this.isLoggedIn = false;
        this.messageType = new pojo_1.MessageType();
        this.callbackMap = new Map();
        this.loginData = {
            chainNodeType: '',
            htlcFeeRate: 0.0001,
            htlcMaxFee: 0.01,
            nodeAddress: '',
            nodePeerId: '',
            userPeerId: '',
        };
        this.verbose = false;
        this.userPeerId = '';
        this.fundLoop = async ({ info, temporary_channel_id, recipient_node_peer_id, recipient_user_peer_id, privkey, times_to_fund, }) => {
            for (let i = 0; i < times_to_fund; i++) {
                const fundingRes = await this.fundingBitcoin(info);
                if (fundingRes.isErr()) {
                    return result_1.err(fundingRes.error);
                }
                const { hex: txhex, inputs } = fundingRes.value;
                let signed_hex = utils_1.signP2PKH({
                    txhex,
                    inputs,
                    privkey,
                    selectedNetwork: this.selectedNetwork,
                });
                this.saveSigningData(temporary_channel_id, { kTbTempData: signed_hex });
                const fundingBitcoinCreatedInfo = new pojo_1.FundingBtcCreated();
                fundingBitcoinCreatedInfo.temporary_channel_id = temporary_channel_id;
                fundingBitcoinCreatedInfo.funding_tx_hex = signed_hex;
                const fundingBitcoinCreatedResponse = await this.bitcoinFundingCreated(recipient_node_peer_id, recipient_user_peer_id, fundingBitcoinCreatedInfo);
                if (fundingBitcoinCreatedResponse.isErr()) {
                    return result_1.err(fundingBitcoinCreatedResponse.error.message);
                }
                if (fundingBitcoinCreatedResponse.value.hex) {
                    const signed_hex100341 = await utils_1.signP2SH({
                        is_first_sign: true,
                        txhex: fundingBitcoinCreatedResponse.value.hex,
                        pubkey_1: fundingBitcoinCreatedResponse.value.pub_key_a,
                        pubkey_2: fundingBitcoinCreatedResponse.value.pub_key_b,
                        privkey,
                        inputs: fundingBitcoinCreatedResponse.value.inputs,
                        selectedNetwork: this.selectedNetwork,
                    });
                    const sendSignedHex100341Response = await this.sendSignedHex100341(recipient_node_peer_id, recipient_user_peer_id, signed_hex100341);
                    if (sendSignedHex100341Response.isErr()) {
                        return result_1.err(sendSignedHex100341Response.error.message);
                    }
                    const waitForPeerResponse = await this.waitForPeer(-110350);
                    try {
                        if (waitForPeerResponse.isErr()) {
                            return result_1.err(waitForPeerResponse.error.message);
                        }
                    }
                    catch (e) {
                        return result_1.err(e);
                    }
                }
            }
            return result_1.ok('Funded successfully.');
        };
        this.sendOmniAsset = async ({ channelId, amount, recipient_node_peer_id, recipient_user_peer_id, }) => {
            try {
                const selectedNetwork = this.selectedNetwork;
                const signingData = this.data.signingData[channelId];
                const addressIndexResponse = await utils_1.getNextOmniboltAddress({
                    addressIndex: this.data.nextAddressIndex,
                    mnemonic: this.mnemonic,
                    selectedNetwork,
                });
                if (addressIndexResponse.isErr()) {
                    return result_1.err(addressIndexResponse.error.message);
                }
                const newAddressIndex = addressIndexResponse.value;
                const newAddressIndexPrivKey = await utils_1.getPrivateKey({
                    addressData: newAddressIndex,
                    mnemonic: this.mnemonic,
                    selectedNetwork,
                });
                if (newAddressIndexPrivKey.isErr()) {
                    return result_1.err(newAddressIndexPrivKey.error.message);
                }
                let newTempPrivKey = newAddressIndexPrivKey.value || '';
                let lastTempPrivKey = signingData?.kTempPrivKey || '';
                const info = {
                    channel_id: channelId,
                    amount,
                    curr_temp_address_pub_key: newAddressIndex.publicKey,
                    last_temp_address_private_key: lastTempPrivKey,
                    curr_temp_address_index: newAddressIndex.index,
                };
                const response = await this.commitmentTransactionCreated(recipient_node_peer_id, recipient_user_peer_id, info);
                if (response.isErr()) {
                    return result_1.err(response.error);
                }
                const e = response.value;
                let cr = e.counterparty_raw_data;
                let inputs = cr.inputs;
                this.logMsg('sendOmniAsset', 'START = ' + new Date().getTime());
                const fundingData = signingData.fundingAddress;
                const fundingPrivKey = await utils_1.getPrivateKey({
                    addressData: fundingData,
                    mnemonic: this.mnemonic,
                    selectedNetwork,
                });
                if (fundingPrivKey.isErr()) {
                    return result_1.err(fundingPrivKey.error.message);
                }
                let privkey = fundingPrivKey.value;
                this.logMsg('sendOmniAsset', 'END READ DB = ' + new Date().getTime());
                let cr_hex = await utils_1.signP2SH({
                    is_first_sign: true,
                    txhex: cr.hex,
                    pubkey_1: cr.pub_key_a,
                    pubkey_2: cr.pub_key_b,
                    privkey,
                    inputs,
                    selectedNetwork,
                });
                this.logMsg('sendOmniAsset', 'END SIGN = ' + new Date().getTime());
                let rr = e.rsmc_raw_data;
                inputs = rr.inputs;
                let rr_hex = await utils_1.signP2SH({
                    is_first_sign: true,
                    txhex: rr.hex,
                    pubkey_1: rr.pub_key_a,
                    pubkey_2: rr.pub_key_b,
                    privkey,
                    inputs,
                    selectedNetwork,
                });
                let signedInfo = {
                    channel_id: e.channel_id,
                    counterparty_signed_hex: cr_hex,
                    rsmc_signed_hex: rr_hex,
                };
                const sendSignedHex100360Response = await this.sendSignedHex100360(recipient_node_peer_id, recipient_user_peer_id, signedInfo);
                if (sendSignedHex100360Response.isErr()) {
                    return result_1.err(sendSignedHex100360Response.error.message);
                }
                const nextAddressIndexResponse = await utils_1.getNextOmniboltAddress({
                    addressIndex: newAddressIndex,
                    mnemonic: this.mnemonic,
                    selectedNetwork,
                });
                if (nextAddressIndexResponse.isErr()) {
                    return result_1.err(nextAddressIndexResponse.error.message);
                }
                this.data.nextAddressIndex = nextAddressIndexResponse.value;
                this.data.signingData[channelId] = {
                    ...this.data.signingData[channelId],
                    addressIndex: newAddressIndex,
                    kTempPrivKey: newTempPrivKey,
                };
                this.saveData(this.data);
                return result_1.ok('');
            }
            catch (e) {
                return result_1.err(e);
            }
        };
        this.logMsg = (p1 = '', p2 = '') => {
            if (!p1 || !p2)
                return;
            if (this.verbose)
                console.info(p1, p2);
        };
        this.websocket = websocket;
        this.verbose = verbose;
        this.defaultUrl = DEFAULT_URL;
        this.selectedNetwork = 'bitcoinTestnet';
        this.saveData = () => null;
        this.onOpen = () => null;
        this.onClose = () => null;
        this.onError = () => null;
        this.data = { ...shapes_1.defaultDataShape };
        this.pendingPeerResponses = {};
        this.mnemonic = '';
    }
    async connect({ url, data, saveData, loginPhrase, mnemonic, listeners, selectedNetwork, onMessage, onChannelCloseAttempt, onChannelClose, onOpen, onError, onClose, onAddHTLC, onForwardR, onSignR, onCloseHTLC, }) {
        const connectResponse = await new Promise((resolve) => {
            if (this.isConnectedToOBD || url !== this.defaultUrl) {
                if (this.ws)
                    this.disconnect();
            }
            if (!url) {
                this.defaultUrl = DEFAULT_URL;
            }
            else {
                this.defaultUrl = url;
            }
            if (!browser_or_node_1.isNode() && !this.websocket) {
                this.websocket = WebSocket;
            }
            if (!this.websocket) {
                return resolve(result_1.err('No websocket available.'));
            }
            this.ws = new this.websocket(`ws://${this.defaultUrl}`);
            this.data = data ?? shapes_1.defaultDataShape;
            if (saveData)
                this.saveData = saveData;
            if (loginPhrase)
                this.loginPhrase = loginPhrase;
            if (mnemonic)
                this.mnemonic = mnemonic;
            if (listeners)
                this.listeners = listeners;
            if (selectedNetwork)
                this.selectedNetwork = selectedNetwork;
            if (onMessage)
                this.onMessage = onMessage;
            if (onOpen)
                this.onOpen = onOpen;
            if (onError)
                this.onError = onError;
            if (onClose)
                this.onClose = onClose;
            if (onChannelCloseAttempt)
                this.onChannelCloseAttempt = onChannelCloseAttempt;
            if (onChannelClose)
                this.onChannelClose = onChannelClose;
            if (onAddHTLC)
                this.onAddHTLC = onAddHTLC;
            if (onForwardR)
                this.onForwardR = onForwardR;
            if (onSignR)
                this.onSignR = onSignR;
            if (onCloseHTLC)
                this.onCloseHTLC = onCloseHTLC;
            this.ws.onopen = () => {
                const msg = `Connected to ${this.defaultUrl}`;
                if (this.onMessage)
                    this.onMessage(msg);
                this.isConnectedToOBD = true;
                this.resumeFromCheckpoints().then();
                this.onOpen(msg);
            };
            this.ws.onmessage = (e) => {
                try {
                    const jsonData = JSON.parse(e.data);
                    this.getDataFromServer(jsonData);
                    if (this.onMessage)
                        this.onMessage(jsonData);
                    try {
                        if (jsonData.type in this.pendingPeerResponses) {
                            if (jsonData?.result) {
                                this.pendingPeerResponses[jsonData.type](result_1.ok(jsonData.result));
                            }
                            else {
                                this.pendingPeerResponses[jsonData.type](result_1.ok(jsonData));
                            }
                        }
                    }
                    catch { }
                    if (jsonData.type == -110032) {
                        if (this.onChannelOpenAttempt)
                            this.onChannelOpenAttempt(jsonData);
                    }
                    if (jsonData.type == -100038 || jsonData.type == -110038) {
                        if (this.onChannelCloseAttempt)
                            this.onChannelCloseAttempt(jsonData);
                    }
                    if (jsonData.type == -110033) {
                        if (this.onAcceptChannel)
                            this.onAcceptChannel(jsonData);
                    }
                    if (jsonData.type == -110340) {
                        if (this.onBitcoinFundingCreated)
                            this.onBitcoinFundingCreated(jsonData);
                    }
                    if (jsonData.type == -110034) {
                        if (this.onAssetFundingCreated)
                            this.onAssetFundingCreated(jsonData);
                    }
                    if (jsonData.type == -110351) {
                        if (this.onCommitmentTransactionCreated)
                            this.onCommitmentTransactionCreated(jsonData);
                    }
                    if (jsonData.type == -110353) {
                        if (this.on110353)
                            this.on110353(jsonData);
                    }
                    if (jsonData.type == -110352) {
                        if (this.on110352)
                            this.on110352(jsonData);
                    }
                    if (jsonData.type == -110038) {
                        if (this.onChannelClose)
                            this.onChannelClose(jsonData);
                    }
                    if (jsonData.type == -110040) {
                        this.onAddHTLC(jsonData);
                    }
                    if (jsonData.type == -100041) {
                    }
                    this.logMsg('-100041', e);
                    resolve(result_1.ok(jsonData));
                }
                catch (error) {
                    this.logMsg('ws.onmessage error', error);
                    if (this.onMessage)
                        this.onMessage(error);
                    resolve(result_1.err(error));
                }
            };
            this.ws.onerror = (e) => {
                this.logMsg('onerror', e);
                this.disconnect();
                this.onError(e.message);
                resolve(result_1.err(e.message));
            };
            this.ws.onclose = (e) => {
                this.logMsg('onclose', 'Closing Up!');
                this.disconnect();
                this.onClose(e.code, e.reason);
            };
        });
        if (connectResponse.isErr()) {
            return result_1.err(connectResponse.error.message);
        }
        const loginResponse = await this.logIn();
        if (loginResponse.isErr()) {
            return result_1.err(loginResponse.error.message);
        }
        return result_1.ok({ ...connectResponse.value, ...loginResponse.value });
    }
    registerEvent(msgType, callback) {
        if (callback == null) {
            this.logMsg('registerEvent', 'callback function is null');
            return;
        }
        if (msgType == null) {
            callback('registerEvent', 'msgType is null');
            return;
        }
        this.callbackMap[msgType] = callback;
    }
    removeEvent(msgType) {
        this.callbackMap.delete(msgType);
        this.logMsg('removeEvent', '----------> removeEvent');
    }
    sendJsonData(msg, type, callback) {
        if (!this.isConnectedToOBD) {
            this.logMsg('sendJsonData', 'Please try to connect to obd again');
            return;
        }
        if (this.isNotString(msg)) {
            this.logMsg('sendJsonData', 'error request content.');
            return;
        }
        this.logMsg(new Date(), '------send json msg------');
        const jsonMsg = JSON.parse(msg);
        this.logMsg(jsonMsg.type, jsonMsg);
        if (callback !== null) {
            this.callbackMap[type] = callback;
        }
        this.ws.send(msg);
    }
    connectToServer(url, callback, globalCallback) {
        if (this.isConnectedToOBD) {
            this.logMsg('connectToServer', 'already connected');
            if (callback)
                callback('already connected');
            return;
        }
        this.globalCallback = globalCallback;
        if (url !== null && url.length > 0) {
            this.defaultUrl = url;
        }
        this.logMsg('connect to ' + this.defaultUrl);
        try {
            this.ws = new this.websocket(`ws://${this.defaultUrl}`);
            this.ws.onopen = (e) => {
                this.logMsg('onopen', e);
                this.logMsg('onopen', 'connect success');
                if (callback !== null) {
                    callback('connect success');
                }
                this.isConnectedToOBD = true;
            };
            this.ws.onmessage = (e) => {
                let jsonData = JSON.parse(e.data);
                this.logMsg(jsonData?.type, jsonData);
                this.getDataFromServer(jsonData);
            };
            this.ws.onclose = (e) => {
                this.logMsg('ws close', e);
                this.isConnectedToOBD = false;
                this.isLoggedIn = false;
                return result_1.err('ws close');
            };
            this.ws.onerror = (e) => {
                this.logMsg('ws error', e);
                return result_1.err('ws error');
            };
        }
        catch (e) {
            this.logMsg('connectToServer error', e);
            return result_1.err(e);
        }
    }
    sendData(msg, callback) {
        if (!this.isConnectedToOBD) {
            return result_1.err('please try to connect obd again');
        }
        if (((msg.type <= -100000 && msg.type >= -102000) ||
            (msg.type <= -103000 && msg.type >= -104000)) &&
            this.isLoggedIn == false) {
            return result_1.err('please login');
        }
        this.logMsg(new Date(), '----------------------------send msg------------------------------');
        this.logMsg(msg?.type, msg);
        if (callback !== null) {
            this.callbackMap[msg.type] = callback;
        }
        this.ws.send(JSON.stringify(msg));
    }
    getDataFromServer(jsonData) {
        this.logMsg(jsonData?.type, jsonData);
        if (this.globalCallback)
            this.globalCallback(jsonData);
        let callback = this.callbackMap[jsonData.type];
        if (jsonData.type == 0)
            return;
        const data = jsonData?.result ? jsonData.result : jsonData;
        if (jsonData.status == false) {
            if (jsonData.type == this.messageType.MsgType_Core_Omni_Getbalance_2112) {
                try {
                    if (callback != null)
                        return callback(result_1.err('Omni Error'));
                }
                catch {
                    return result_1.err(data);
                }
            }
            if (jsonData.type !== this.messageType.MsgType_Error_0) {
                this.logMsg('messageType.MsgType_Error_0', data);
            }
            try {
                if (callback != null)
                    return callback(result_1.err(data));
            }
            catch { }
            return result_1.err(data);
        }
        if (jsonData.type == this.messageType.MsgType_Error_0) {
            let tempData = {};
            tempData.type = jsonData.type;
            tempData.result = jsonData.data;
            tempData.sender_peer_id = jsonData.sender_peer_id;
            tempData.recipient_user_peer_id = jsonData.recipient_user_peer_id;
            jsonData = tempData;
        }
        let fromId = jsonData.from;
        let toId = jsonData.to;
        fromId = fromId.split('@')[0];
        toId = toId.split('@')[0];
        if (fromId !== toId) {
            if (callback !== null) {
                data['to_peer_id'] = toId;
                try {
                    return callback(result_1.ok(data));
                }
                catch {
                    return result_1.err(jsonData);
                }
            }
            return;
        }
        if (callback != null)
            callback(result_1.ok(data));
        if (this.loginData.userPeerId === fromId)
            return;
        switch (jsonData.type) {
            case this.messageType.MsgType_UserLogin_2001:
                this.userPeerId = toId;
                this.onLogIn(jsonData);
                break;
            case this.messageType.MsgType_UserLogout_2002:
                this.onLogout(jsonData);
                break;
            case this.messageType.MsgType_Core_FundingBTC_2109:
                this.onFundingBitcoin(jsonData);
                break;
            case this.messageType.MsgType_Core_Omni_ListProperties_2117:
                this.onListProperties(jsonData);
                break;
            case this.messageType.MsgType_Core_Omni_FundingAsset_2120:
                this.onFundingAsset(jsonData);
                break;
            case this.messageType.MsgType_Mnemonic_CreateAddress_3000:
                this.onGenAddressFromMnemonic(jsonData);
                break;
            case this.messageType.MsgType_Mnemonic_GetAddressByIndex_3001:
                this.onGetAddressInfo(jsonData);
                break;
            case this.messageType.MsgType_SendChannelOpen_32:
                this.onOpenChannel(jsonData);
                break;
            case this.messageType.MsgType_SendChannelAccept_33:
                if (this.onAcceptChannel)
                    this.onAcceptChannel(jsonData);
                break;
            case this.messageType.MsgType_FundingCreate_SendAssetFundingCreated_34:
                if (this.onAssetFundingCreated)
                    this.onAssetFundingCreated(jsonData);
                break;
            case this.messageType.MsgType_FundingSign_SendAssetFundingSigned_35:
                this.onAssetFundingSigned(jsonData);
                break;
            case this.messageType
                .MsgType_CommitmentTx_SendCommitmentTransactionCreated_351:
                if (this.onCommitmentTransactionCreated)
                    this.onCommitmentTransactionCreated(jsonData);
                break;
            case this.messageType.MsgType_ClientSign_BobC2b_Rd_353:
                if (this.on110353)
                    this.on110353(jsonData);
                break;
            case this.messageType
                .MsgType_CommitmentTxSigned_RecvRevokeAndAcknowledgeCommitmentTransaction_352:
                if (this.on110352)
                    this.on110352(jsonData);
                break;
            case this.messageType
                .MsgType_CommitmentTxSigned_SendRevokeAndAcknowledgeCommitmentTransaction_352:
                this.onCommitmentTransactionAccepted(jsonData);
                break;
            case this.messageType.MsgType_HTLC_Invoice_402:
                this.onAddInvoice(jsonData);
                break;
            case this.messageType.MsgType_HTLC_FindPath_401:
                this.onHTLCFindPath(jsonData);
                break;
            case this.messageType.MsgType_HTLC_SendAddHTLC_40:
                this.onAddHTLC(jsonData);
                break;
            case this.messageType.MsgType_HTLC_SendAddHTLCSigned_41:
                this.onHtlcSigned(jsonData);
                break;
            case this.messageType.MsgType_HTLC_SendVerifyR_45:
                this.onForwardR(jsonData);
                break;
            case this.messageType.MsgType_HTLC_SendSignVerifyR_46:
                this.onSignR(jsonData);
                break;
            case this.messageType.MsgType_HTLC_SendRequestCloseCurrTx_49:
                this.onCloseHTLC(jsonData);
                break;
            case this.messageType.MsgType_HTLC_SendCloseSigned_50:
                this.onCloseHTLCSigned(jsonData);
                break;
            case this.messageType.MsgType_Core_Omni_GetTransaction_2118:
                this.onGetTransaction(jsonData);
                break;
            case this.messageType.MsgType_Core_Omni_CreateNewTokenFixed_2113:
                this.onIssueFixedAmount(jsonData);
                break;
        }
    }
    async logIn(mnemonic) {
        if (this.isLoggedIn) {
            return result_1.err('You are already logged in!');
        }
        if (!mnemonic || this.isNotString(mnemonic)) {
            mnemonic = this?.loginPhrase ?? '';
        }
        if (!mnemonic) {
            return result_1.err('empty mnemonic');
        }
        let msg = new pojo_1.Message();
        msg.type = this.messageType.MsgType_UserLogin_2001;
        msg.data['mnemonic'] = mnemonic;
        return new Promise(async (resolve) => {
            const loginResponse = await this.sendData(msg, resolve);
            if (loginResponse && loginResponse.isOk()) {
                return result_1.ok(loginResponse.value);
            }
            return result_1.err(loginResponse?.error?.message);
        });
    }
    onLogIn(resultData) {
        if (!this.isLoggedIn)
            this.isLoggedIn = true;
        this.loginData = resultData.result;
    }
    disconnect() {
        this.ws.close();
    }
    async logout() {
        if (this.isLoggedIn) {
            let msg = new pojo_1.Message();
            msg.type = this.messageType.MsgType_UserLogout_2002;
            return new Promise(async (resolve) => this.sendData(msg, resolve));
        }
        else {
            return result_1.ok('You have logged out.');
        }
    }
    onLogout(jsonData) {
        this.isLoggedIn = false;
    }
    async connectPeer(info) {
        if (this.isNotString(info.remote_node_address)) {
            return result_1.err('Empty remote_node_address');
        }
        let msg = new pojo_1.Message();
        msg.data = info;
        msg.type = this.messageType.MsgType_p2p_ConnectPeer_2003;
        return new Promise((resolve) => this.sendData(msg, resolve));
    }
    async fundingBitcoin(info) {
        if (this.isNotString(info.from_address)) {
            return result_1.err('empty from_address');
        }
        if (this.isNotString(info.to_address)) {
            return result_1.err('empty to_address');
        }
        if (info.amount == null || info.amount <= 0) {
            return result_1.err('wrong amount');
        }
        if (info.miner_fee == null || info.miner_fee <= 0) {
            info.miner_fee = 0;
        }
        let msg = new pojo_1.Message();
        msg.type = this.messageType.MsgType_Core_FundingBTC_2109;
        msg.data = info;
        return new Promise(async (resolve) => this.sendData(msg, resolve));
    }
    onFundingBitcoin(jsonData) { }
    async bitcoinFundingCreated(recipient_node_peer_id, recipient_user_peer_id, info) {
        if (this.isNotString(recipient_node_peer_id)) {
            return result_1.err('error recipient_node_peer_id');
        }
        if (this.isNotString(recipient_user_peer_id)) {
            return result_1.err('error recipient_user_peer_id');
        }
        if (this.isNotString(info.temporary_channel_id)) {
            return result_1.err('empty temporary_channel_id');
        }
        if (this.isNotString(info.funding_tx_hex)) {
            return result_1.err('empty funding_tx_hex');
        }
        let msg = new pojo_1.Message();
        msg.type = this.messageType.MsgType_FundingCreate_SendBtcFundingCreated_340;
        msg.recipient_user_peer_id = recipient_user_peer_id;
        msg.recipient_node_peer_id = recipient_node_peer_id;
        msg.data = info;
        return new Promise(async (resolve) => this.sendData(msg, resolve));
    }
    async sendSignedHex100341(recipient_node_peer_id, recipient_user_peer_id, signed_hex) {
        if (this.isNotString(recipient_node_peer_id)) {
            return result_1.err('error recipient_node_peer_id');
        }
        if (this.isNotString(recipient_user_peer_id)) {
            return result_1.err('error recipient_user_peer_id');
        }
        let msg = new pojo_1.Message();
        msg.type = this.messageType.MsgType_FundingCreate_BtcFundingMinerRDTxToClient_341;
        msg.recipient_user_peer_id = recipient_user_peer_id;
        msg.recipient_node_peer_id = recipient_node_peer_id;
        msg.data['hex'] = signed_hex;
        return new Promise(async (resolve) => this.sendData(msg, resolve));
    }
    async bitcoinFundingSigned(recipient_node_peer_id, recipient_user_peer_id, info) {
        if (this.isNotString(recipient_node_peer_id)) {
            return result_1.err('error recipient_node_peer_id');
        }
        if (this.isNotString(recipient_user_peer_id)) {
            return result_1.err('error recipient_user_peer_id');
        }
        if (this.isNotString(info.temporary_channel_id)) {
            return result_1.err('empty temporary_channel_id');
        }
        if (this.isNotString(info.funding_txid)) {
            return result_1.err('empty funding_txid');
        }
        if (this.isNotString(info.signed_miner_redeem_transaction_hex)) {
            return result_1.err('empty signed_miner_redeem_transaction_hex');
        }
        let msg = new pojo_1.Message();
        msg.type = this.messageType.MsgType_FundingSign_SendBtcSign_350;
        msg.recipient_user_peer_id = recipient_user_peer_id;
        msg.recipient_node_peer_id = recipient_node_peer_id;
        msg.data = info;
        return new Promise(async (resolve) => this.sendData(msg, resolve));
    }
    async listProperties() {
        let msg = new pojo_1.Message();
        msg.type = this.messageType.MsgType_Core_Omni_ListProperties_2117;
        return new Promise(async (resolve) => this.sendData(msg, resolve));
    }
    onListProperties(jsonData) { }
    async fundingAsset(info) {
        if (this.isNotString(info.from_address)) {
            return result_1.err('empty from_address');
        }
        if (this.isNotString(info.to_address)) {
            return result_1.err('empty to_address');
        }
        if (info.property_id == null || info.property_id <= 0) {
            return result_1.err('error property_id');
        }
        if (info.amount == null || info.amount <= 0) {
            return result_1.err('Incorrect amount');
        }
        if (info.miner_fee == null || info.miner_fee <= 0) {
            info.miner_fee = 0;
        }
        let msg = new pojo_1.Message();
        msg.type = this.messageType.MsgType_Core_Omni_FundingAsset_2120;
        msg.data = info;
        return new Promise(async (resolve) => this.sendData(msg, resolve));
    }
    onFundingAsset(jsonData) { }
    async sendAsset(info) {
        if (this.isNotString(info.from_address)) {
            return result_1.err('empty from_address');
        }
        if (this.isNotString(info.to_address)) {
            return result_1.err('empty to_address');
        }
        if (info.property_id == null || info.property_id <= 0) {
            return result_1.err('error property_id');
        }
        if (info.amount == null || info.amount <= 0) {
            return result_1.err('wrong amount');
        }
        let msg = new pojo_1.Message();
        msg.type = this.messageType.MsgType_Core_Omni_Send_2121;
        msg.data = info;
        return new Promise(async (resolve) => this.sendData(msg, resolve));
    }
    onSendAsset(jsonData) { }
    async genAddressFromMnemonic() {
        let msg = new pojo_1.Message();
        msg.type = this.messageType.MsgType_Mnemonic_CreateAddress_3000;
        return new Promise(async (resolve) => this.sendData(msg, resolve));
    }
    onGenAddressFromMnemonic(jsonData) { }
    async getAddressInfo(index) {
        if (index == null || index < 0) {
            return result_1.err('error index');
        }
        let msg = new pojo_1.Message();
        msg.type = this.messageType.MsgType_Mnemonic_GetAddressByIndex_3001;
        msg.data = index;
        return new Promise(async (resolve) => this.sendData(msg, resolve));
    }
    onGetAddressInfo(jsonData) { }
    async createChannel({ remote_node_address, recipient_user_peer_id, info: { fundingAddressIndex = 0, amount_to_fund = 0.00009, miner_fee = 0.000001, asset_id, asset_amount, }, }) {
        if (this.isNotString(remote_node_address)) {
            return result_1.err('error remote_node_address');
        }
        const recipient_node_id_index = remote_node_address.lastIndexOf('/');
        if (recipient_node_id_index === -1) {
            return result_1.err('invalid remote_node_address');
        }
        const recipient_node_peer_id = remote_node_address.substring(recipient_node_id_index + 1);
        if (this.isNotString(recipient_node_peer_id)) {
            return result_1.err('error recipient_node_peer_id');
        }
        if (this.isNotString(recipient_user_peer_id)) {
            return result_1.err('error recipient_user_peer_id');
        }
        if (!(fundingAddressIndex >= 0)) {
            return result_1.err('error fundingAddressIndex');
        }
        if (!asset_id)
            return result_1.err('Please prove an asset_id.');
        if (!asset_amount)
            return result_1.err('Please provide an asset_amount that is greater than 0.');
        if (this.loginData.nodePeerId !== recipient_node_peer_id) {
            await this.connectPeer({
                remote_node_address,
            });
        }
        const fundingAddress = await this.getFundingAddress({
            index: fundingAddressIndex,
        });
        if (fundingAddress.isErr()) {
            return result_1.err(fundingAddress.error.message);
        }
        const info = {
            funding_pubkey: fundingAddress.value.publicKey,
            is_private: false,
        };
        const openChannelResponse = await this.openChannel(recipient_node_peer_id, recipient_user_peer_id, info);
        if (openChannelResponse.isErr()) {
            return result_1.err(openChannelResponse.error);
        }
        const channelAcceptResponse = await this.waitForPeer(-110033, 10000);
        if (channelAcceptResponse.isErr()) {
            return result_1.err(channelAcceptResponse.error.message);
        }
        const temporary_channel_id = openChannelResponse.value.temporary_channel_id;
        const addressIndex = await this.getNewSigningAddress();
        if (addressIndex.isErr()) {
            return result_1.err(addressIndex.error.message);
        }
        const data = {
            fundingAddress: fundingAddress.value,
            addressIndex: addressIndex.value,
        };
        await this.saveSigningData(temporary_channel_id, data);
        await utils_1.sleep(2000);
        return await this.fundTempChannel({
            recipient_node_peer_id,
            recipient_user_peer_id,
            temporary_channel_id,
            info: {
                fundingAddressIndex,
                amount_to_fund,
                miner_fee,
                asset_id,
                asset_amount,
            },
        });
    }
    waitForPeer(methodType, timeout = 2000) {
        return new Promise(async (resolve) => {
            this.pendingPeerResponses[methodType] = resolve;
            return await utils_1.promiseTimeout(timeout, this.pendingPeerResponses[methodType]);
        });
    }
    async fundTempChannel({ recipient_node_peer_id, recipient_user_peer_id, temporary_channel_id, info: { fundingAddressIndex = 0, amount_to_fund = 0.0001, miner_fee = 0.000008, asset_id = 137, asset_amount = 0, }, }) {
        const fundingAddress = await this.getFundingAddress({
            index: fundingAddressIndex,
        });
        if (fundingAddress.isErr()) {
            return result_1.err(fundingAddress.error.message);
        }
        const channels = await this.getMyChannels();
        if (channels.isErr()) {
            return result_1.err(channels.error.message);
        }
        const tempChannelFilter = await Promise.all(channels.value.data.filter((temp) => temp.temporary_channel_id === temporary_channel_id));
        if (!tempChannelFilter || tempChannelFilter?.length < 1) {
            return result_1.err('Unable to locate provided channel.');
        }
        const tempChannel = tempChannelFilter[0];
        const timesToFund = Math.abs(3 - tempChannel.btc_funding_times);
        const fundingAddressPrivKey = await utils_1.getPrivateKey({
            addressData: fundingAddress.value,
            selectedNetwork: this.selectedNetwork,
            mnemonic: this.mnemonic,
        });
        if (fundingAddressPrivKey.isErr()) {
            return result_1.err(fundingAddressPrivKey.error.message);
        }
        let info = new pojo_1.BtcFundingInfo();
        info.from_address = fundingAddress.value.address;
        info.to_address = tempChannel.channel_address;
        info.amount = amount_to_fund;
        info.miner_fee = miner_fee;
        const [fundLoopResponse] = await Promise.all([
            this.fundLoop({
                info,
                recipient_user_peer_id,
                recipient_node_peer_id,
                privkey: fundingAddressPrivKey.value,
                times_to_fund: timesToFund,
                temporary_channel_id,
            }),
        ]);
        if (fundLoopResponse.isErr()) {
            return result_1.err(fundLoopResponse.error);
        }
        const fundingAssetInfo = new pojo_1.OmniFundingAssetInfo();
        fundingAssetInfo.from_address = fundingAddress.value.address;
        fundingAssetInfo.to_address = tempChannel.channel_address;
        fundingAssetInfo.property_id = asset_id;
        fundingAssetInfo.amount = asset_amount;
        fundingAssetInfo.miner_fee = miner_fee;
        const fundingAssetResponse = await this.fundingAsset(fundingAssetInfo);
        if (fundingAssetResponse.isErr())
            return result_1.err(fundingAssetResponse.error.message);
        const signed_hex = utils_1.signP2PKH({
            txhex: fundingAssetResponse.value.hex,
            privkey: fundingAddressPrivKey.value,
            inputs: fundingAssetResponse.value.inputs,
            selectedNetwork: this.selectedNetwork,
        });
        this.saveSigningData(temporary_channel_id, { kTbTempData: signed_hex });
        const assetFundingCreatedInfo = new pojo_1.AssetFundingCreatedInfo();
        assetFundingCreatedInfo.temporary_channel_id = temporary_channel_id;
        assetFundingCreatedInfo.funding_tx_hex = signed_hex;
        assetFundingCreatedInfo.temp_address_pub_key =
            fundingAddress.value.publicKey;
        assetFundingCreatedInfo.temp_address_index = fundingAddress.value.index;
        const assetFundingCreatedResponse = await this.assetFundingCreated(recipient_node_peer_id, recipient_user_peer_id, assetFundingCreatedInfo);
        if (assetFundingCreatedResponse.isErr()) {
            return result_1.err(assetFundingCreatedResponse.error.message);
        }
        const signed_hex101034 = await utils_1.signP2SH({
            is_first_sign: true,
            txhex: assetFundingCreatedResponse.value.hex,
            pubkey_1: assetFundingCreatedResponse.value.pub_key_a,
            pubkey_2: assetFundingCreatedResponse.value.pub_key_b,
            privkey: fundingAddressPrivKey.value,
            inputs: assetFundingCreatedResponse.value.inputs,
            selectedNetwork: this.selectedNetwork,
        });
        const sendSignedHex101034Response = await this.sendSignedHex101034(recipient_node_peer_id, recipient_user_peer_id, signed_hex101034);
        if (sendSignedHex101034Response.isErr()) {
            return result_1.err(sendSignedHex101034Response.error.message);
        }
        const waitFor110035Response = await this.waitForPeer(-110035);
        if (waitFor110035Response.isErr()) {
            return result_1.err(waitFor110035Response.error.message);
        }
        this.saveSigningData(temporary_channel_id, {
            kTempPrivKey: fundingAddressPrivKey.value,
        });
        const signed_hex101134 = await utils_1.signP2SH({
            is_first_sign: true,
            txhex: waitFor110035Response.value.hex,
            pubkey_1: waitFor110035Response.value.pub_key_a,
            pubkey_2: waitFor110035Response.value.pub_key_b,
            privkey: fundingAddressPrivKey.value,
            inputs: waitFor110035Response.value.inputs,
            selectedNetwork: this.selectedNetwork,
        });
        let sendSignedHex101134Info = new pojo_1.SignedInfo101134();
        sendSignedHex101134Info.channel_id = waitFor110035Response.value.channel_id;
        sendSignedHex101134Info.rd_signed_hex = signed_hex101134;
        const sendSignedHex101134Response = await this.sendSignedHex101134(sendSignedHex101134Info);
        if (sendSignedHex101134Response.isErr()) {
            return result_1.err(sendSignedHex101134Response.error.message);
        }
        this.saveData(this.data);
        delete Object.assign(this.data.signingData, {
            [sendSignedHex101134Info.channel_id]: this.data.signingData[temporary_channel_id],
        })[temporary_channel_id];
        this.clearOmniboltCheckpoint({ channelId: temporary_channel_id });
        this.saveData(this.data);
        return sendSignedHex101134Response;
    }
    async getFundingAddress({ index = 0, }) {
        let fundingAddress;
        if (this.data?.fundingAddresses && index in this.data.fundingAddresses) {
            fundingAddress = this.data['fundingAddresses'][index];
        }
        else {
            const fundingAddressRes = await utils_1.generateFundingAddress({
                index,
                selectedNetwork: this.selectedNetwork,
                mnemonic: this.mnemonic,
            });
            if (fundingAddressRes.isErr()) {
                return result_1.err(fundingAddressRes.error.message);
            }
            fundingAddress = fundingAddressRes.value;
            this.data['fundingAddresses'][`${index}`] = fundingAddress;
            this.saveData(this.data);
            return result_1.ok(fundingAddress);
        }
        return result_1.ok(fundingAddress);
    }
    saveSigningData(channel_id, data) {
        if (!this.data.signingData[channel_id]) {
            this.data.signingData[channel_id] = { ...shapes_1.channelSigningData };
        }
        this.data.signingData[channel_id] = {
            ...this.data.signingData[channel_id],
            ...data,
        };
        this.saveData(this.data);
    }
    async openChannel(recipient_node_peer_id, recipient_user_peer_id, info) {
        if (this.isNotString(recipient_node_peer_id)) {
            return result_1.err('error recipient_node_peer_id');
        }
        if (this.isNotString(recipient_user_peer_id)) {
            return result_1.err('error recipient_user_peer_id');
        }
        if (this.isNotString(info.funding_pubkey)) {
            return result_1.err('error funding_pubkey');
        }
        if (info.is_private == null) {
            info.is_private = false;
        }
        let msg = new pojo_1.Message();
        msg.type = this.messageType.MsgType_SendChannelOpen_32;
        msg.recipient_node_peer_id = recipient_node_peer_id;
        msg.recipient_user_peer_id = recipient_user_peer_id;
        msg.data = info;
        return new Promise(async (resolve) => this.sendData(msg, resolve));
    }
    onOpenChannel(jsonData) {
        this.logMsg('onOpenChannel', jsonData);
    }
    async acceptChannel(recipient_node_peer_id, recipient_user_peer_id, info) {
        if (this.isNotString(recipient_node_peer_id)) {
            return result_1.err('error recipient_node_peer_id');
        }
        if (this.isNotString(recipient_user_peer_id)) {
            return result_1.err('error recipient_user_peer_id');
        }
        if (this.isNotString(info.temporary_channel_id)) {
            return result_1.err('empty temporary_channel_id');
        }
        if (info.approval == null) {
            info.approval = false;
        }
        if (info.approval) {
            if (this.isNotString(info.funding_pubkey)) {
                return result_1.err('empty funding_pubkey');
            }
        }
        let msg = new pojo_1.Message();
        msg.type = this.messageType.MsgType_SendChannelAccept_33;
        msg.recipient_node_peer_id = recipient_node_peer_id;
        msg.recipient_user_peer_id = recipient_user_peer_id;
        msg.data = info;
        return new Promise(async (resolve) => this.sendData(msg, resolve));
    }
    async onChannelOpenAttempt(data) {
        const listenerId = 'onChannelOpenAttempt';
        try {
            this.listener(listenerId, 'start', data);
            const { funder_node_address, funder_peer_id, temporary_channel_id, } = data.result;
            this.updateOmniboltCheckpoint({
                channelId: data.result.temporary_channel_id,
                checkpoint: 'onChannelOpenAttempt',
                data,
            });
            const fundingAddress = this.data.nextAddressIndex;
            const funding_pubkey = fundingAddress.publicKey;
            const info = {
                temporary_channel_id,
                funding_pubkey,
                approval: true,
                fundee_address_index: fundingAddress.index,
            };
            const response = await this.acceptChannel(funder_node_address, funder_peer_id, info);
            if (response.isErr()) {
                return this.listener(listenerId, 'failure', response.error.message);
            }
            const nextOmniboltAddress = await utils_1.getNextOmniboltAddress({
                addressIndex: this.data.nextAddressIndex,
                selectedNetwork: this.selectedNetwork,
                mnemonic: this.mnemonic,
            });
            if (nextOmniboltAddress.isErr()) {
                return result_1.err(nextOmniboltAddress.error.message);
            }
            this.data.nextAddressIndex = nextOmniboltAddress.value;
            this.data.signingData[temporary_channel_id] = shapes_1.channelSigningData;
            this.data.signingData[temporary_channel_id] = {
                ...this.data.signingData[temporary_channel_id],
                fundingAddress: fundingAddress,
                addressIndex: fundingAddress,
            };
            this.clearOmniboltCheckpoint({
                channelId: temporary_channel_id,
            });
            this.saveData(this.data);
            return this.listener('onChannelOpenAttempt', 'success', data);
        }
        catch (e) {
            return this.listener(listenerId, 'failure', e);
        }
    }
    async onAcceptChannel(data) {
        await this.listener('onAcceptChannel', 'start', data);
        this.updateOmniboltCheckpoint({
            channelId: data.result.temporary_channel_id,
            checkpoint: 'onAcceptChannel',
            data,
        });
        this.listener('onAcceptChannel', 'success', data);
    }
    async onBitcoinFundingCreated(data) {
        const listenerId = 'onBitcoinFundingCreated';
        try {
            this.listener(listenerId, 'start', data);
            this.updateOmniboltCheckpoint({
                channelId: data.result.sign_data.temporary_channel_id,
                checkpoint: 'onBitcoinFundingCreated',
                data,
            });
            const tempChannelId = data.result.sign_data.temporary_channel_id;
            let signingData = this.data.signingData[tempChannelId];
            const fundingAddress = signingData.fundingAddress;
            const privkey = await utils_1.getPrivateKey({
                addressData: fundingAddress,
                selectedNetwork: this.selectedNetwork,
                mnemonic: this.mnemonic,
            });
            if (privkey.isErr()) {
                return this.listener(listenerId, 'failure', privkey.error.message);
            }
            const { funder_node_address, funder_peer_id, sign_data } = data.result;
            const signed_hex = await utils_1.signP2SH({
                is_first_sign: false,
                txhex: sign_data.hex,
                pubkey_1: sign_data.pub_key_a,
                pubkey_2: sign_data.pub_key_b,
                privkey: privkey.value,
                inputs: sign_data.inputs,
                selectedNetwork: this.selectedNetwork,
            });
            const txid = data.result.funding_txid;
            const info = {
                temporary_channel_id: tempChannelId,
                funding_txid: txid,
                approval: true,
                signed_miner_redeem_transaction_hex: signed_hex,
            };
            const response = await this.bitcoinFundingSigned(funder_node_address, funder_peer_id, info);
            if (response.isErr()) {
                return this.listener(listenerId, 'failure', response.error.message);
            }
            this.data.signingData[tempChannelId] = {
                ...this.data.signingData[tempChannelId],
                kTbSignedHex: signed_hex,
                funding_txid: txid,
            };
            this.clearOmniboltCheckpoint({
                channelId: tempChannelId,
            });
            this.saveData(this.data);
            return this.listener(listenerId, 'success', response.value);
        }
        catch (e) {
            return this.listener(listenerId, 'failure', e);
        }
    }
    async listening110340(e) {
        const selectedNetwork = this.selectedNetwork;
        let channel_id = e.temporary_channel_id;
        const signingData = this.data.signingData[channel_id];
        const fundingAddress = signingData.fundingAddress;
        const privkeyResponse = await utils_1.getPrivateKey({
            addressData: fundingAddress,
            selectedNetwork,
            mnemonic: this.mnemonic,
        });
        if (privkeyResponse.isErr())
            return result_1.err(privkeyResponse.error.message);
        const privkey = privkeyResponse.value;
        let data = e.sign_data;
        const signed_hex = await utils_1.signP2SH({
            is_first_sign: false,
            txhex: data.hex,
            pubkey_1: data.pub_key_a,
            pubkey_2: data.pub_key_b,
            privkey,
            inputs: data.inputs,
            selectedNetwork,
        });
        this.data.signingData[channel_id] = {
            ...this.data.signingData[channel_id],
            kTbSignedHex: signed_hex,
        };
        this.saveSigningData(channel_id, { funding_txid: e.funding_txid });
        let nodeID = e.funder_node_address;
        let userID = e.funder_peer_id;
        let info = new pojo_1.FundingBtcSigned();
        info.temporary_channel_id = channel_id;
        info.funding_txid = e.funding_txid;
        info.signed_miner_redeem_transaction_hex = signed_hex;
        info.approval = true;
        await this.bitcoinFundingSigned(nodeID, userID, info);
        let returnData = {
            nodeID: nodeID,
            userID: userID,
            info350: info,
            privkey: privkey,
        };
        return result_1.ok(returnData);
    }
    async onAssetFundingCreated(data) {
        const listenerId = 'onAssetFundingCreated';
        try {
            this.listener(listenerId, 'start', data);
            const selectedNetwork = this.selectedNetwork;
            const tempChannelId = data.result.sign_data.temporary_channel_id;
            this.updateOmniboltCheckpoint({
                channelId: tempChannelId,
                checkpoint: 'onAssetFundingCreated',
                data,
            });
            const signingData = this.data.signingData[tempChannelId];
            const fundingAddress = signingData.fundingAddress;
            const privkey = await utils_1.getPrivateKey({
                addressData: fundingAddress,
                selectedNetwork,
                mnemonic: this.mnemonic,
            });
            if (privkey.isErr()) {
                return this.listener('onAssetFundingCreated', 'failure', privkey.error.message);
            }
            const { funder_node_address, funder_peer_id, sign_data } = data.result;
            const signed_hex = await utils_1.signP2SH({
                is_first_sign: false,
                txhex: sign_data.hex,
                pubkey_1: sign_data.pub_key_a,
                pubkey_2: sign_data.pub_key_b,
                privkey: privkey.value,
                inputs: sign_data.inputs,
                selectedNetwork,
            });
            const info = {
                temporary_channel_id: tempChannelId,
                signed_alice_rsmc_hex: signed_hex,
            };
            const response = await this.assetFundingSigned(funder_node_address, funder_peer_id, info);
            if (response.isErr()) {
                return this.listener('onAssetFundingCreated', 'failure', response.error.message);
            }
            this.data.signingData[tempChannelId] = {
                ...this.data.signingData[tempChannelId],
                kTbSignedHex: signed_hex,
            };
            const sendSignedHex101035Data = {
                funder_node_address,
                funder_peer_id,
                result: response.value,
            };
            this.updateOmniboltCheckpoint({
                checkpoint: 'sendSignedHex101035',
                channelId: tempChannelId,
                data: sendSignedHex101035Data,
            }, false);
            this.saveData(this.data);
            this.listener('onAssetFundingCreated', 'success', sendSignedHex101035Data);
            return await this.sendSignedHex101035({
                data: response.value,
                channelId: tempChannelId,
                recipient_node_peer_id: funder_node_address,
                recipient_user_peer_id: funder_peer_id,
            });
        }
        catch (e) {
            return result_1.err(e);
        }
    }
    async listening110035(e) {
        const listenerId = 'listening110035';
        this.listener(listenerId, 'start', e);
        this.logMsg('listening110035 = ' + JSON.stringify(e));
        const channel_id = e.channel_id;
        const newChannelId = channel_id;
        const oldChannelId = e.temporary_channel_id;
        delete Object.assign(this.data.signingData, {
            [newChannelId]: this.data.signingData[oldChannelId],
        })[oldChannelId];
        this.clearOmniboltCheckpoint({ channelId: oldChannelId });
        this.saveData(this.data);
        const signingData = this.data.signingData[newChannelId];
        const selectedNetwork = this.selectedNetwork;
        let signed_hex = await utils_1.signP2SH({
            is_first_sign: false,
            txhex: e.hex,
            pubkey_1: e.pub_key_a,
            pubkey_2: e.pub_key_b,
            privkey: signingData.kTempPrivKey,
            inputs: e.inputs,
            selectedNetwork,
        });
        let info = new pojo_1.SignedInfo101134();
        info.channel_id = channel_id;
        info.rd_signed_hex = signed_hex;
        const sendSignedHex101134Response = await this.sendSignedHex101134(info);
        if (sendSignedHex101134Response.isErr()) {
            return this.listener(listenerId, 'failure', sendSignedHex101134Response.error.message);
        }
        return this.listener(listenerId, 'success', sendSignedHex101134Response);
    }
    async onCommitmentTransactionCreated(data) {
        const listenerId = 'onCommitmentTransactionCreated';
        this.listener(listenerId, 'start', data);
        const channelId = data.result.channel_id;
        this.updateOmniboltCheckpoint({
            checkpoint: 'onCommitmentTransactionCreated',
            channelId: channelId,
            data,
        });
        const signingData = this.data.signingData[channelId];
        const selectedNetwork = this.selectedNetwork;
        const cr = data.result.counterparty_raw_data;
        const crInputs = cr.inputs;
        const privKeyResponse = await utils_1.getPrivateKey({
            addressData: signingData.fundingAddress,
            mnemonic: this.mnemonic,
            selectedNetwork,
        });
        if (privKeyResponse.isErr()) {
            return this.listener(listenerId, 'failure', privKeyResponse.error.message);
        }
        const fundingPrivateKey = privKeyResponse.value;
        let cr_hex = await utils_1.signP2SH({
            is_first_sign: false,
            txhex: cr.hex,
            pubkey_1: cr.pub_key_a,
            pubkey_2: cr.pub_key_b,
            privkey: fundingPrivateKey,
            inputs: crInputs,
            selectedNetwork,
        });
        let rr = data.result.rsmc_raw_data;
        const rrInputs = rr.inputs;
        let rr_hex = await utils_1.signP2SH({
            is_first_sign: false,
            txhex: rr.hex,
            pubkey_1: rr.pub_key_a,
            pubkey_2: rr.pub_key_b,
            privkey: fundingPrivateKey,
            inputs: rrInputs,
            selectedNetwork,
        });
        this.data.signingData[channelId] = {
            ...this.data.signingData[channelId],
            kTbSignedHexCR110351: cr_hex,
            kTbSignedHexRR110351: rr_hex,
        };
        this.saveData(this.data);
        let nodeID = data.result.payer_node_address;
        let userID = data.result.payer_peer_id;
        const addressIndexResponse = await utils_1.getNextOmniboltAddress({
            addressIndex: this.data.nextAddressIndex,
            selectedNetwork: this.selectedNetwork,
            mnemonic: this.mnemonic,
        });
        if (addressIndexResponse.isErr()) {
            return this.listener(listenerId, 'failure', addressIndexResponse.error.message);
        }
        const newAddressIndex = addressIndexResponse.value;
        const newAddressIndexPrivKey = await utils_1.getPrivateKey({
            addressData: newAddressIndex,
            selectedNetwork: this.selectedNetwork,
            mnemonic: this.mnemonic,
        });
        if (newAddressIndexPrivKey.isErr()) {
            return this.listener(listenerId, 'failure', newAddressIndexPrivKey.error.message);
        }
        let newTempPrivKey = newAddressIndexPrivKey.value || '';
        let lastTempPrivKey = signingData?.kTempPrivKey || '';
        let info = {
            channel_id: channelId,
            msg_hash: data.result.msg_hash,
            c2a_rsmc_signed_hex: rr_hex,
            c2a_counterparty_signed_hex: cr_hex,
            curr_temp_address_pub_key: newAddressIndex.publicKey,
            last_temp_address_private_key: lastTempPrivKey,
            approval: true,
            curr_temp_address_index: newAddressIndex.index,
        };
        const commitmentTransactionAcceptedResponse = await this.commitmentTransactionAccepted(nodeID, userID, info);
        if (commitmentTransactionAcceptedResponse.isErr()) {
            return this.listener(listenerId, 'failure', commitmentTransactionAcceptedResponse.error.message);
        }
        const checkpointData = {
            info: commitmentTransactionAcceptedResponse.value,
            userID,
            nodeID,
        };
        this.updateOmniboltCheckpoint({
            channelId,
            data: checkpointData,
            checkpoint: 'commitmentTransactionAccepted',
        });
        const commitTxAcceptedResponse = await this.handleCommitmentTransactionAccepted(checkpointData);
        if (commitTxAcceptedResponse.isErr()) {
            return this.listener(listenerId, 'failure', commitTxAcceptedResponse.error.message);
        }
        const nextOmniboltAddress = await utils_1.getNextOmniboltAddress({
            addressIndex: this.data.nextAddressIndex,
            selectedNetwork: this.selectedNetwork,
            mnemonic: this.mnemonic,
        });
        if (nextOmniboltAddress.isErr()) {
            return this.listener(listenerId, 'failure', nextOmniboltAddress.error.message);
        }
        this.data.nextAddressIndex = nextOmniboltAddress.value;
        this.data.signingData[channelId] = {
            ...this.data.signingData[channelId],
            addressIndex: newAddressIndex,
            kTempPrivKey: newTempPrivKey,
        };
        this.clearOmniboltCheckpoint({
            channelId,
        });
        this.saveData(this.data);
        return this.listener(listenerId, 'success', commitTxAcceptedResponse.value);
    }
    async handleCommitmentTransactionAccepted({ info, userID, nodeID, }) {
        const listenerId = 'commitmentTransactionAccepted';
        const selectedNetwork = this.selectedNetwork;
        const channelId = info.channel_id;
        const signingData = this.data.signingData[channelId];
        const e = info;
        let ab = e.c2a_br_raw_data;
        let inputs = ab.inputs;
        const { fundingAddress } = signingData;
        const fundingPrivKey = await utils_1.getPrivateKey({
            addressData: fundingAddress,
            mnemonic: this.mnemonic,
            selectedNetwork,
        });
        if (fundingPrivKey.isErr()) {
            return this.listener(listenerId, 'failure', fundingPrivKey.error.message);
        }
        let privkey = fundingPrivKey.value;
        let ab_hex = await utils_1.signP2SH({
            is_first_sign: true,
            txhex: ab.hex,
            pubkey_1: ab.pub_key_a,
            pubkey_2: ab.pub_key_b,
            privkey,
            inputs,
            selectedNetwork,
        });
        let ar = e.c2a_rd_raw_data;
        inputs = ar.inputs;
        let ar_hex = await utils_1.signP2SH({
            is_first_sign: true,
            txhex: ar.hex,
            pubkey_1: ar.pub_key_a,
            pubkey_2: ar.pub_key_b,
            privkey,
            inputs,
            selectedNetwork,
        });
        let bc = e.c2b_counterparty_raw_data;
        inputs = bc.inputs;
        let bc_hex = await utils_1.signP2SH({
            is_first_sign: true,
            txhex: bc.hex,
            pubkey_1: bc.pub_key_a,
            pubkey_2: bc.pub_key_b,
            privkey,
            inputs,
            selectedNetwork,
        });
        let br = e.c2b_rsmc_raw_data;
        inputs = br.inputs;
        let br_hex = await utils_1.signP2SH({
            is_first_sign: true,
            txhex: br.hex,
            pubkey_1: br.pub_key_a,
            pubkey_2: br.pub_key_b,
            privkey,
            inputs,
            selectedNetwork,
        });
        let signedInfo = {
            channel_id: e.channel_id,
            c2b_rsmc_signed_hex: br_hex,
            c2b_counterparty_signed_hex: bc_hex,
            c2a_rd_signed_hex: ar_hex,
            c2a_br_signed_hex: ab_hex,
            c2a_br_id: ab.br_id,
        };
        const sendSignedHex100361Response = await this.sendSignedHex100361(nodeID, userID, signedInfo);
        if (sendSignedHex100361Response.isErr()) {
            return this.listener(listenerId, 'failure', sendSignedHex100361Response.error.message);
        }
        this.data.signingData[channelId] = {
            ...this.data.signingData[channelId],
            kTempPrivKey: privkey,
        };
        this.clearOmniboltCheckpoint({
            channelId,
        });
        this.saveData(this.data);
        return this.listener(listenerId, 'success', sendSignedHex100361Response.value);
    }
    async on110352(data) {
        const listenerId = 'on110352';
        this.listener(listenerId, 'start', data);
        const selectedNetwork = this.selectedNetwork;
        const channelId = data.result.channel_id;
        this.updateOmniboltCheckpoint({
            channelId,
            checkpoint: listenerId,
            data,
        });
        const signingData = this.data.signingData[channelId];
        const e = data.result;
        let nodeID = e.payee_node_address;
        let userID = e.payee_peer_id;
        let rd = e.c2a_rd_partial_data;
        const rd_inputs = rd.inputs;
        const tempPrivKey = await utils_1.getPrivateKey({
            addressData: signingData.addressIndex,
            mnemonic: this.mnemonic,
            selectedNetwork,
        });
        if (tempPrivKey.isErr()) {
            return this.listener(listenerId, 'failure', tempPrivKey.error.message);
        }
        let tempKey = tempPrivKey.value;
        let rd_hex = await utils_1.signP2SH({
            is_first_sign: false,
            txhex: rd.hex,
            pubkey_1: rd.pub_key_a,
            pubkey_2: rd.pub_key_b,
            privkey: tempKey,
            inputs: rd_inputs,
            selectedNetwork,
        });
        const fundingData = signingData.fundingAddress;
        const privKeyResult = await utils_1.getPrivateKey({
            addressData: fundingData,
            selectedNetwork,
            mnemonic: this.mnemonic,
        });
        if (privKeyResult.isErr()) {
            return this.listener(listenerId, 'failure', privKeyResult.error.message);
        }
        let privkey = privKeyResult.value;
        let cp = e.c2b_counterparty_partial_data;
        const cp_inputs = cp.inputs;
        let cp_hex = await utils_1.signP2SH({
            is_first_sign: false,
            txhex: cp.hex,
            pubkey_1: cp.pub_key_a,
            pubkey_2: cp.pub_key_b,
            privkey,
            inputs: cp_inputs,
            selectedNetwork,
        });
        let rp = e.c2b_rsmc_partial_data;
        const rp_inputs = rp.inputs;
        let rp_hex = await utils_1.signP2SH({
            is_first_sign: false,
            txhex: rp.hex,
            pubkey_1: rp.pub_key_a,
            pubkey_2: rp.pub_key_b,
            privkey,
            inputs: rp_inputs,
            selectedNetwork,
        });
        const signedInfo100362 = {
            channel_id: e.channel_id,
            c2b_rsmc_signed_hex: rp_hex,
            c2b_counterparty_signed_hex: cp_hex,
            c2a_rd_signed_hex: rd_hex,
        };
        let resp = await this.sendSignedHex100362(nodeID, userID, signedInfo100362);
        if (resp.isErr()) {
            return this.listener(listenerId, 'failure', resp.error.message);
        }
        const sendSignedHex100363Data = {
            data: resp.value,
            privkey,
            channelId: e.channel_id,
            nodeID,
            userID,
        };
        this.updateOmniboltCheckpoint({
            channelId: data.result.channel_id,
            checkpoint: 'sendSignedHex100363',
            data: sendSignedHex100363Data,
        });
        return await this.handleSendSignedHex100363(sendSignedHex100363Data);
    }
    async handleSendSignedHex100363({ data, privkey, channelId, nodeID, userID, }) {
        const listenerId = 'sendSignedHex100363';
        try {
            const selectedNetwork = this.selectedNetwork;
            this.listener(listenerId, 'start', data);
            let br = data.c2b_br_raw_data;
            let br_inputs = br.inputs;
            let br_hex = await utils_1.signP2SH({
                is_first_sign: true,
                txhex: br.hex,
                pubkey_1: br.pub_key_a,
                pubkey_2: br.pub_key_b,
                privkey,
                inputs: br_inputs,
                selectedNetwork,
            });
            let rd = data.c2b_rd_raw_data;
            const rd_inputs = rd.inputs;
            const rdData = {
                is_first_sign: true,
                txhex: rd.hex,
                pubkey_1: rd.pub_key_a,
                pubkey_2: rd.pub_key_b,
                privkey,
                inputs: rd_inputs,
                selectedNetwork,
            };
            let rd_hex = await utils_1.signP2SH(rdData);
            let signedInfo100363 = {
                channel_id: channelId,
                c2b_rd_signed_hex: rd_hex,
                c2b_br_signed_hex: br_hex,
                c2b_br_id: br.br_id,
            };
            const sendSignedHex100363Res = await this.sendSignedHex100363(nodeID, userID, signedInfo100363);
            if (sendSignedHex100363Res.isErr()) {
                return this.listener(listenerId, 'failure', sendSignedHex100363Res.error.message);
            }
            this.clearOmniboltCheckpoint({ channelId });
            this.saveData(this.data);
            return this.listener(listenerId, 'success', sendSignedHex100363Res.value);
        }
        catch (e) {
            return this.listener(listenerId, 'failure', e);
        }
    }
    async on110353(data) {
        const listenerId = 'on110353';
        try {
            this.listener(listenerId, 'start', data);
            this.updateOmniboltCheckpoint({
                channelId: data.result.channel_id,
                checkpoint: listenerId,
                data,
            });
            const selectedNetwork = this.selectedNetwork;
            const channelId = data.result.channel_id;
            let rd = data.result.c2b_rd_partial_data;
            let inputs = rd.inputs;
            const signingData = this.data.signingData[channelId];
            const privKeyResponse = await utils_1.getPrivateKey({
                addressData: signingData.addressIndex,
                mnemonic: this.mnemonic,
                selectedNetwork,
            });
            if (privKeyResponse.isErr()) {
                return this.listener(listenerId, 'failure', privKeyResponse.error.message);
            }
            let rd_hex = await utils_1.signP2SH({
                is_first_sign: false,
                txhex: rd.hex,
                pubkey_1: rd.pub_key_a,
                pubkey_2: rd.pub_key_b,
                privkey: privKeyResponse.value,
                inputs: inputs,
                selectedNetwork,
            });
            let signedInfo = {
                channel_id: data.result.channel_id,
                c2b_rd_signed_hex: rd_hex,
            };
            const sendSignedHex100364Res = await this.sendSignedHex100364(signedInfo);
            if (sendSignedHex100364Res.isErr()) {
                return this.listener(listenerId, 'failure', sendSignedHex100364Res.error.message);
            }
            this.clearOmniboltCheckpoint({
                channelId: data.result.channel_id,
            });
            this.saveData(this.data);
            return this.listener(listenerId, 'success', sendSignedHex100364Res.value);
        }
        catch (e) {
            return this.listener(listenerId, 'failure', e);
        }
    }
    async checkChannelAddessExist(recipient_node_peer_id, recipient_user_peer_id, info) {
        if (this.isNotString(recipient_node_peer_id)) {
            return result_1.err('error recipient_node_peer_id');
        }
        if (this.isNotString(recipient_user_peer_id)) {
            return result_1.err('error recipient_user_peer_id');
        }
        if (this.isNotString(info.temporary_channel_id)) {
            return result_1.err('empty temporary_channel_id');
        }
        if (info.approval == null) {
            info.approval = false;
        }
        if (info.approval) {
            if (this.isNotString(info.funding_pubkey)) {
                return result_1.err('empty funding_pubkey');
            }
        }
        let msg = new pojo_1.Message();
        msg.type = this.messageType.MsgType_CheckChannelAddessExist_3156;
        msg.recipient_node_peer_id = recipient_node_peer_id;
        msg.recipient_user_peer_id = recipient_user_peer_id;
        msg.data = info;
        return new Promise(async (resolve) => this.sendData(msg, resolve));
    }
    onCheckChannelAddessExist(jsonData) { }
    async assetFundingCreated(recipient_node_peer_id, recipient_user_peer_id, info) {
        if (this.isNotString(recipient_node_peer_id)) {
            return result_1.err('error recipient_node_peer_id');
        }
        if (this.isNotString(recipient_user_peer_id)) {
            return result_1.err('error recipient_user_peer_id');
        }
        if (this.isNotString(info.temporary_channel_id)) {
            return result_1.err('empty temporary_channel_id');
        }
        if (this.isNotString(info.funding_tx_hex)) {
            return result_1.err('empty funding_tx_hex');
        }
        if (this.isNotString(info.temp_address_pub_key)) {
            return result_1.err('empty temp_address_pub_key');
        }
        let msg = new pojo_1.Message();
        msg.type = this.messageType.MsgType_FundingCreate_SendAssetFundingCreated_34;
        msg.recipient_user_peer_id = recipient_user_peer_id;
        msg.recipient_node_peer_id = recipient_node_peer_id;
        msg.data = info;
        return new Promise(async (resolve) => this.sendData(msg, resolve));
    }
    async sendSignedHex101034(recipient_node_peer_id, recipient_user_peer_id, signed_hex) {
        if (this.isNotString(recipient_node_peer_id)) {
            return result_1.err('error recipient_node_peer_id');
        }
        if (this.isNotString(recipient_user_peer_id)) {
            return result_1.err('error recipient_user_peer_id');
        }
        let msg = new pojo_1.Message();
        msg.type = this.messageType.MsgType_ClientSign_AssetFunding_AliceSignC1a_1034;
        msg.recipient_user_peer_id = recipient_user_peer_id;
        msg.recipient_node_peer_id = recipient_node_peer_id;
        msg.data['signed_c1a_hex'] = signed_hex;
        return new Promise(async (resolve) => this.sendData(msg, resolve));
    }
    async sendSignedHex101134(info) {
        if (this.isNotString(info.channel_id)) {
            return result_1.err('empty channel_id');
        }
        let msg = new pojo_1.Message();
        msg.type = this.messageType.MsgType_ClientSign_AssetFunding_AliceSignRD_1134;
        msg.data = info;
        return new Promise(async (resolve) => this.sendData(msg, resolve));
    }
    async assetFundingSigned(recipient_node_peer_id, recipient_user_peer_id, info) {
        if (this.isNotString(recipient_node_peer_id)) {
            return result_1.err('error recipient_node_peer_id');
        }
        if (this.isNotString(recipient_user_peer_id)) {
            return result_1.err('error recipient_user_peer_id');
        }
        if (this.isNotString(info.temporary_channel_id)) {
            return result_1.err('empty temporary_channel_id');
        }
        if (this.isNotString(info.signed_alice_rsmc_hex)) {
            return result_1.err('empty signed_alice_rsmc_hex');
        }
        let msg = new pojo_1.Message();
        msg.type = this.messageType.MsgType_FundingSign_SendAssetFundingSigned_35;
        msg.recipient_user_peer_id = recipient_user_peer_id;
        msg.recipient_node_peer_id = recipient_node_peer_id;
        msg.data = info;
        return new Promise(async (resolve) => this.sendData(msg, resolve));
    }
    onAssetFundingSigned(jsonData) { }
    async sendSignedHex101035({ data, channelId, recipient_node_peer_id, recipient_user_peer_id, }) {
        const listenerId = 'sendSignedHex101035';
        try {
            this.listener(listenerId, 'start', data);
            const selectedNetwork = this.selectedNetwork;
            const channel_id = channelId;
            const signingData = this.data.signingData[channel_id];
            let br = data.alice_br_sign_data;
            let inputs = br.inputs;
            let privkeyResponse = await utils_1.getPrivateKey({
                addressData: signingData.fundingAddress,
                mnemonic: this.mnemonic,
                selectedNetwork,
            });
            if (privkeyResponse.isErr()) {
                return this.listener(listenerId, 'failure', privkeyResponse.error.message);
            }
            const privkey = privkeyResponse.value;
            let br_hex = await utils_1.signP2SH({
                is_first_sign: true,
                txhex: br.hex,
                pubkey_1: br.pub_key_a,
                pubkey_2: br.pub_key_b,
                privkey,
                inputs,
                selectedNetwork,
            });
            let rd = data.alice_rd_sign_data;
            inputs = rd.inputs;
            let rd_hex = await utils_1.signP2SH({
                is_first_sign: true,
                txhex: rd.hex,
                pubkey_1: rd.pub_key_a,
                pubkey_2: rd.pub_key_b,
                privkey,
                inputs,
                selectedNetwork,
            });
            const signedInfo = {
                temporary_channel_id: channel_id,
                rd_signed_hex: rd_hex,
                br_signed_hex: br_hex,
                br_id: br.br_id,
            };
            const sendSignedResponse = await this.handleSendSignedHex101035(recipient_node_peer_id, recipient_user_peer_id, signedInfo);
            if (sendSignedResponse.isErr()) {
                return this.listener(listenerId, 'failure', sendSignedResponse.error.message);
            }
            const newChannelId = sendSignedResponse.value.channel_id;
            const oldChannelId = data.temporary_channel_id;
            delete Object.assign(this.data.signingData, {
                [newChannelId]: this.data.signingData[oldChannelId],
            })[oldChannelId];
            this.clearOmniboltCheckpoint({ channelId: channel_id });
            this.saveData(this.data);
            return this.listener(listenerId, 'success', sendSignedResponse);
        }
        catch (e) {
            return this.listener(listenerId, 'failure', e);
        }
    }
    async handleSendSignedHex101035(recipient_node_peer_id, recipient_user_peer_id, info) {
        const listenerId = 'sendSignedHex101035';
        try {
            if (this.isNotString(recipient_node_peer_id)) {
                return this.listener(listenerId, 'failure', 'error recipient_node_peer_id');
            }
            if (this.isNotString(recipient_user_peer_id)) {
                return this.listener(listenerId, 'failure', 'error recipient_user_peer_id');
            }
            if (this.isNotString(info.temporary_channel_id)) {
                return this.listener(listenerId, 'failure', 'empty temporary_channel_id');
            }
            let msg = new pojo_1.Message();
            msg.type = this.messageType.MsgType_ClientSign_Duplex_AssetFunding_RdAndBr_1035;
            msg.recipient_user_peer_id = recipient_user_peer_id;
            msg.recipient_node_peer_id = recipient_node_peer_id;
            msg.data = info;
            return new Promise(async (resolve) => this.sendData(msg, resolve));
        }
        catch (e) {
            return this.listener(listenerId, 'failure', e);
        }
    }
    async commitmentTransactionCreated(recipient_node_peer_id, recipient_user_peer_id, info) {
        if (this.isNotString(recipient_node_peer_id)) {
            return result_1.err('error recipient_node_peer_id');
        }
        if (this.isNotString(recipient_user_peer_id)) {
            return result_1.err('error recipient_user_peer_id');
        }
        if (this.isNotString(info.channel_id)) {
            return result_1.err('empty channel_id');
        }
        if (this.isNotString(info.curr_temp_address_pub_key)) {
            return result_1.err('empty curr_temp_address_pub_key');
        }
        if (info.amount == null || info.amount <= 0) {
            return result_1.err('wrong amount');
        }
        let msg = new pojo_1.Message();
        msg.type = this.messageType.MsgType_CommitmentTx_SendCommitmentTransactionCreated_351;
        msg.recipient_user_peer_id = recipient_user_peer_id;
        msg.recipient_node_peer_id = recipient_node_peer_id;
        msg.data = info;
        return new Promise(async (resolve) => this.sendData(msg, resolve));
    }
    async sendSignedHex100360(recipient_node_peer_id, recipient_user_peer_id, info) {
        if (this.isNotString(recipient_node_peer_id)) {
            return result_1.err('error recipient_node_peer_id');
        }
        if (this.isNotString(recipient_user_peer_id)) {
            return result_1.err('error recipient_user_peer_id');
        }
        if (this.isNotString(info.channel_id)) {
            return result_1.err('empty channel_id');
        }
        let msg = new pojo_1.Message();
        msg.type = this.messageType.MsgType_ClientSign_CommitmentTx_AliceSignC2a_360;
        msg.recipient_user_peer_id = recipient_user_peer_id;
        msg.recipient_node_peer_id = recipient_node_peer_id;
        msg.data = info;
        return new Promise(async (resolve) => this.sendData(msg, resolve));
    }
    async commitmentTransactionAccepted(recipient_node_peer_id, recipient_user_peer_id, info) {
        if (this.isNotString(recipient_node_peer_id)) {
            return result_1.err('error recipient_node_peer_id');
        }
        if (this.isNotString(recipient_user_peer_id)) {
            return result_1.err('error recipient_user_peer_id');
        }
        if (this.isNotString(info.channel_id)) {
            return result_1.err('empty channel_id');
        }
        if (this.isNotString(info.msg_hash)) {
            return result_1.err('empty msg_hash');
        }
        if (info.approval == null) {
            info.approval = false;
        }
        if (info.approval == true) {
            if (this.isNotString(info.curr_temp_address_pub_key)) {
                return result_1.err('empty curr_temp_address_pub_key');
            }
        }
        let msg = new pojo_1.Message();
        msg.type = this.messageType.MsgType_CommitmentTxSigned_SendRevokeAndAcknowledgeCommitmentTransaction_352;
        msg.recipient_user_peer_id = recipient_user_peer_id;
        msg.recipient_node_peer_id = recipient_node_peer_id;
        msg.data = info;
        return new Promise(async (resolve) => this.sendData(msg, resolve));
    }
    onCommitmentTransactionAccepted(jsonData) { }
    async sendSignedHex100361(recipient_node_peer_id, recipient_user_peer_id, info) {
        if (this.isNotString(recipient_node_peer_id)) {
            return result_1.err('error recipient_node_peer_id');
        }
        if (this.isNotString(recipient_user_peer_id)) {
            return result_1.err('error recipient_user_peer_id');
        }
        if (this.isNotString(info.channel_id)) {
            return result_1.err('empty channel_id');
        }
        let msg = new pojo_1.Message();
        msg.type = this.messageType.MsgType_ClientSign_CommitmentTx_BobSignC2b_361;
        msg.recipient_user_peer_id = recipient_user_peer_id;
        msg.recipient_node_peer_id = recipient_node_peer_id;
        msg.data = info;
        return new Promise(async (resolve) => this.sendData(msg, resolve));
    }
    async sendSignedHex100362(recipient_node_peer_id, recipient_user_peer_id, info) {
        if (this.isNotString(recipient_node_peer_id)) {
            return result_1.err('error recipient_node_peer_id');
        }
        if (this.isNotString(recipient_user_peer_id)) {
            return result_1.err('error recipient_user_peer_id');
        }
        if (this.isNotString(info.channel_id)) {
            return result_1.err('empty channel_id');
        }
        let msg = new pojo_1.Message();
        msg.type = this.messageType.MsgType_ClientSign_CommitmentTx_AliceSignC2b_362;
        msg.recipient_user_peer_id = recipient_user_peer_id;
        msg.recipient_node_peer_id = recipient_node_peer_id;
        msg.data = info;
        return new Promise(async (resolve) => this.sendData(msg, resolve));
    }
    async sendSignedHex100363(recipient_node_peer_id, recipient_user_peer_id, info) {
        if (this.isNotString(recipient_node_peer_id)) {
            return result_1.err('error recipient_node_peer_id');
        }
        if (this.isNotString(recipient_user_peer_id)) {
            return result_1.err('error recipient_user_peer_id');
        }
        if (this.isNotString(info.channel_id)) {
            return result_1.err('empty channel_id');
        }
        let msg = new pojo_1.Message();
        msg.type = this.messageType.MsgType_ClientSign_CommitmentTx_AliceSignC2b_Rd_363;
        msg.recipient_user_peer_id = recipient_user_peer_id;
        msg.recipient_node_peer_id = recipient_node_peer_id;
        msg.data = info;
        return new Promise(async (resolve) => this.sendData(msg, resolve));
    }
    async sendSignedHex100364(info) {
        if (this.isNotString(info.channel_id)) {
            return result_1.err('empty channel_id');
        }
        let msg = new pojo_1.Message();
        msg.type = this.messageType.MsgType_ClientSign_CommitmentTx_BobSignC2b_Rd_364;
        msg.data = info;
        return new Promise(async (resolve) => this.sendData(msg, resolve));
    }
    async addInvoice(info) {
        if (info.property_id == null || info.property_id <= 0) {
            return result_1.err('empty property_id');
        }
        if (info.amount == null || info.amount <= 0) {
            return result_1.err('wrong amount');
        }
        if (this.isNotString(info.h)) {
            return result_1.err('empty h');
        }
        if (this.isNotString(info.expiry_time)) {
            return result_1.err('empty expiry_time');
        }
        let msg = new pojo_1.Message();
        msg.type = this.messageType.MsgType_HTLC_Invoice_402;
        msg.data = info;
        return new Promise(async (resolve) => this.sendData(msg, resolve));
    }
    onAddInvoice(jsonData) { }
    async HTLCFindPath(info) {
        if (!info.is_inv_pay) {
            if (info.property_id == null || info.property_id <= 0) {
                return result_1.err('empty property_id');
            }
            if (info.amount == null || info.amount < 0.001) {
                return result_1.err('wrong amount');
            }
            if (this.isNotString(info.h)) {
                return result_1.err('empty h');
            }
            if (this.isNotString(info.expiry_time)) {
                return result_1.err('empty expiry_time');
            }
        }
        else if (this.isNotString(info.invoice)) {
            return result_1.err('empty invoice');
        }
        let msg = new pojo_1.Message();
        msg.type = this.messageType.MsgType_HTLC_FindPath_401;
        msg.data = info;
        return new Promise(async (resolve) => this.sendData(msg, resolve));
    }
    onHTLCFindPath(jsonData) { }
    async addHTLC(recipient_node_peer_id, recipient_user_peer_id, info) {
        if (this.isNotString(recipient_node_peer_id)) {
            return result_1.err('error recipient_node_peer_id');
        }
        if (this.isNotString(recipient_user_peer_id)) {
            return result_1.err('error recipient_user_peer_id');
        }
        if (this.isNotString(info.h)) {
            return result_1.err('empty h');
        }
        if (info.property_id <= 0) {
            return result_1.err('wrong property_id');
        }
        if (info.amount <= 0) {
            return result_1.err('wrong amount');
        }
        if (this.isNotString(info.memo)) {
            info.memo = '';
        }
        if (this.isNotString(info.routing_packet)) {
            return result_1.err('empty routing_packet');
        }
        if (info.cltv_expiry <= 0) {
            return result_1.err('wrong cltv_expiry');
        }
        if (this.isNotString(info.last_temp_address_private_key)) {
            return result_1.err('empty last_temp_address_private_key');
        }
        if (this.isNotString(info.curr_rsmc_temp_address_pub_key)) {
            return result_1.err('empty curr_rsmc_temp_address_pub_key');
        }
        if (this.isNotString(info.curr_htlc_temp_address_pub_key)) {
            return result_1.err('empty curr_htlc_temp_address_pub_key');
        }
        if (this.isNotString(info.curr_htlc_temp_address_for_ht1a_pub_key)) {
            return result_1.err('empty curr_htlc_temp_address_for_ht1a_pub_key');
        }
        let msg = new pojo_1.Message();
        msg.type = this.messageType.MsgType_HTLC_SendAddHTLC_40;
        msg.data = info;
        msg.recipient_user_peer_id = recipient_user_peer_id;
        msg.recipient_node_peer_id = recipient_node_peer_id;
        return new Promise(async (resolve) => this.sendData(msg, resolve));
    }
    onAddHTLC(jsonData) { }
    async sendSignedHex100100(recipient_node_peer_id, recipient_user_peer_id, info) {
        if (this.isNotString(recipient_node_peer_id)) {
            return result_1.err('error recipient_node_peer_id');
        }
        if (this.isNotString(recipient_user_peer_id)) {
            return result_1.err('error recipient_user_peer_id');
        }
        if (this.isNotString(info.channel_id)) {
            return result_1.err('empty channel_id');
        }
        let msg = new pojo_1.Message();
        msg.type = this.messageType.MsgType_HTLC_ClientSign_Alice_C3a_100;
        msg.recipient_user_peer_id = recipient_user_peer_id;
        msg.recipient_node_peer_id = recipient_node_peer_id;
        msg.data = info;
        return new Promise(async (resolve) => this.sendData(msg, resolve));
    }
    async sendSignedHex100101(recipient_node_peer_id, recipient_user_peer_id, info) {
        if (this.isNotString(recipient_node_peer_id)) {
            return result_1.err('error recipient_node_peer_id');
        }
        if (this.isNotString(recipient_user_peer_id)) {
            return result_1.err('error recipient_user_peer_id');
        }
        if (this.isNotString(info.channel_id)) {
            return result_1.err('empty channel_id');
        }
        let msg = new pojo_1.Message();
        msg.type = this.messageType.MsgType_HTLC_ClientSign_Bob_C3b_101;
        msg.recipient_user_peer_id = recipient_user_peer_id;
        msg.recipient_node_peer_id = recipient_node_peer_id;
        msg.data = info;
        return new Promise(async (resolve) => this.sendData(msg, resolve));
    }
    async sendSignedHex100102(info) {
        if (this.isNotString(info.channel_id)) {
            return result_1.err('empty channel_id');
        }
        let msg = new pojo_1.Message();
        msg.type = this.messageType.MsgType_HTLC_ClientSign_Alice_C3b_102;
        msg.data = info;
        return new Promise(async (resolve) => this.sendData(msg, resolve));
    }
    async sendSignedHex100103(recipient_node_peer_id, recipient_user_peer_id, info) {
        if (this.isNotString(recipient_node_peer_id)) {
            return result_1.err('error recipient_node_peer_id');
        }
        if (this.isNotString(recipient_user_peer_id)) {
            return result_1.err('error recipient_user_peer_id');
        }
        if (this.isNotString(info.channel_id)) {
            return result_1.err('empty channel_id');
        }
        let msg = new pojo_1.Message();
        msg.type = this.messageType.MsgType_HTLC_ClientSign_Alice_C3bSub_103;
        msg.recipient_user_peer_id = recipient_user_peer_id;
        msg.recipient_node_peer_id = recipient_node_peer_id;
        msg.data = info;
        return new Promise(async (resolve) => this.sendData(msg, resolve));
    }
    async sendSignedHex100104(info) {
        if (this.isNotString(info.channel_id)) {
            return result_1.err('empty channel_id');
        }
        if (this.isNotString(info.curr_htlc_temp_address_for_he_pub_key)) {
            return result_1.err('empty curr_htlc_temp_address_for_he_pub_key');
        }
        let msg = new pojo_1.Message();
        msg.type = this.messageType.MsgType_HTLC_ClientSign_Bob_C3bSub_104;
        msg.data = info;
        return new Promise(async (resolve) => this.sendData(msg, resolve));
    }
    async sendSignedHex100105(recipient_node_peer_id, recipient_user_peer_id, info) {
        if (this.isNotString(recipient_node_peer_id)) {
            return result_1.err('error recipient_node_peer_id');
        }
        if (this.isNotString(recipient_user_peer_id)) {
            return result_1.err('error recipient_user_peer_id');
        }
        if (this.isNotString(info.channel_id)) {
            return result_1.err('empty channel_id');
        }
        let msg = new pojo_1.Message();
        msg.type = this.messageType.MsgType_HTLC_ClientSign_Alice_He_105;
        msg.recipient_user_peer_id = recipient_user_peer_id;
        msg.recipient_node_peer_id = recipient_node_peer_id;
        msg.data = info;
        return new Promise(async (resolve) => this.sendData(msg, resolve));
    }
    async sendSignedHex100106(recipient_node_peer_id, recipient_user_peer_id, info) {
        if (this.isNotString(recipient_node_peer_id)) {
            return result_1.err('error recipient_node_peer_id');
        }
        if (this.isNotString(recipient_user_peer_id)) {
            return result_1.err('error recipient_user_peer_id');
        }
        if (this.isNotString(info.channel_id)) {
            return result_1.err('empty channel_id');
        }
        let msg = new pojo_1.Message();
        msg.type = this.messageType.MsgType_HTLC_ClientSign_Bob_HeSub_106;
        msg.recipient_user_peer_id = recipient_user_peer_id;
        msg.recipient_node_peer_id = recipient_node_peer_id;
        msg.data = info;
        return new Promise(async (resolve) => this.sendData(msg, resolve));
    }
    async sendSignedHex100110(recipient_node_peer_id, recipient_user_peer_id, info) {
        if (this.isNotString(recipient_node_peer_id)) {
            return result_1.err('error recipient_node_peer_id');
        }
        if (this.isNotString(recipient_user_peer_id)) {
            return result_1.err('error recipient_user_peer_id');
        }
        if (this.isNotString(info.channel_id)) {
            return result_1.err('empty channel_id');
        }
        let msg = new pojo_1.Message();
        msg.type = this.messageType.MsgType_HTLC_Close_ClientSign_Alice_C4a_110;
        msg.recipient_user_peer_id = recipient_user_peer_id;
        msg.recipient_node_peer_id = recipient_node_peer_id;
        msg.data = info;
        return new Promise(async (resolve) => this.sendData(msg, resolve));
    }
    async sendSignedHex100111(recipient_node_peer_id, recipient_user_peer_id, info) {
        if (this.isNotString(recipient_node_peer_id)) {
            return result_1.err('error recipient_node_peer_id');
        }
        if (this.isNotString(recipient_user_peer_id)) {
            return result_1.err('error recipient_user_peer_id');
        }
        if (this.isNotString(info.channel_id)) {
            return result_1.err('empty channel_id');
        }
        let msg = new pojo_1.Message();
        msg.type = this.messageType.MsgType_HTLC_Close_ClientSign_Bob_C4b_111;
        msg.recipient_user_peer_id = recipient_user_peer_id;
        msg.recipient_node_peer_id = recipient_node_peer_id;
        msg.data = info;
        return new Promise(async (resolve) => this.sendData(msg, resolve));
    }
    async sendSignedHex100112(info) {
        if (this.isNotString(info.channel_id)) {
            return result_1.err('empty channel_id');
        }
        let msg = new pojo_1.Message();
        msg.type = this.messageType.MsgType_HTLC_Close_ClientSign_Alice_C4b_112;
        msg.data = info;
        return new Promise(async (resolve) => this.sendData(msg, resolve));
    }
    async sendSignedHex100113(recipient_node_peer_id, recipient_user_peer_id, info) {
        if (this.isNotString(recipient_node_peer_id)) {
            return result_1.err('error recipient_node_peer_id');
        }
        if (this.isNotString(recipient_user_peer_id)) {
            return result_1.err('error recipient_user_peer_id');
        }
        if (this.isNotString(info.channel_id)) {
            return result_1.err('empty channel_id');
        }
        let msg = new pojo_1.Message();
        msg.type = this.messageType.MsgType_HTLC_Close_ClientSign_Alice_C4bSub_113;
        msg.recipient_user_peer_id = recipient_user_peer_id;
        msg.recipient_node_peer_id = recipient_node_peer_id;
        msg.data = info;
        return new Promise(async (resolve) => this.sendData(msg, resolve));
    }
    async sendSignedHex100114(info) {
        if (this.isNotString(info.channel_id)) {
            return result_1.err('empty channel_id');
        }
        let msg = new pojo_1.Message();
        msg.type = this.messageType.MsgType_HTLC_Close_ClientSign_Bob_C4bSubResult_114;
        msg.data = info;
        return new Promise(async (resolve) => this.sendData(msg, resolve));
    }
    async htlcSigned(recipient_node_peer_id, recipient_user_peer_id, info) {
        if (this.isNotString(recipient_node_peer_id)) {
            return result_1.err('error recipient_node_peer_id');
        }
        if (this.isNotString(recipient_user_peer_id)) {
            return result_1.err('error recipient_user_peer_id');
        }
        if (this.isNotString(info.payer_commitment_tx_hash)) {
            return result_1.err('empty payer_commitment_tx_hash');
        }
        if (this.isNotString(info.curr_rsmc_temp_address_pub_key)) {
            return result_1.err('empty curr_rsmc_temp_address_pub_key');
        }
        if (this.isNotString(info.curr_htlc_temp_address_pub_key)) {
            return result_1.err('empty curr_htlc_temp_address_pub_key');
        }
        let msg = new pojo_1.Message();
        msg.type = this.messageType.MsgType_HTLC_SendAddHTLCSigned_41;
        msg.data = info;
        msg.recipient_user_peer_id = recipient_user_peer_id;
        msg.recipient_node_peer_id = recipient_node_peer_id;
        return new Promise(async (resolve) => this.sendData(msg, resolve));
    }
    onHtlcSigned(jsonData) { }
    async forwardR(recipient_node_peer_id, recipient_user_peer_id, info) {
        if (this.isNotString(recipient_node_peer_id)) {
            return result_1.err('error recipient_node_peer_id');
        }
        if (this.isNotString(recipient_user_peer_id)) {
            return result_1.err('error recipient_user_peer_id');
        }
        if (this.isNotString(info.channel_id)) {
            return result_1.err('empty channel_id');
        }
        if (this.isNotString(info.r)) {
            return result_1.err('empty r');
        }
        let msg = new pojo_1.Message();
        msg.type = this.messageType.MsgType_HTLC_SendVerifyR_45;
        msg.data = info;
        msg.recipient_user_peer_id = recipient_user_peer_id;
        msg.recipient_node_peer_id = recipient_node_peer_id;
        return new Promise(async (resolve) => this.sendData(msg, resolve));
    }
    onForwardR(jsonData) { }
    async signR(recipient_node_peer_id, recipient_user_peer_id, info) {
        if (this.isNotString(recipient_node_peer_id)) {
            return result_1.err('error recipient_node_peer_id');
        }
        if (this.isNotString(recipient_user_peer_id)) {
            return result_1.err('error recipient_user_peer_id');
        }
        if (this.isNotString(info.channel_id)) {
            return result_1.err('empty channel_id');
        }
        let msg = new pojo_1.Message();
        msg.type = this.messageType.MsgType_HTLC_SendSignVerifyR_46;
        msg.data = info;
        msg.recipient_user_peer_id = recipient_user_peer_id;
        msg.recipient_node_peer_id = recipient_node_peer_id;
        return new Promise(async (resolve) => this.sendData(msg, resolve));
    }
    onSignR(jsonData) { }
    async closeHTLC(recipient_node_peer_id, recipient_user_peer_id, info) {
        if (this.isNotString(recipient_node_peer_id)) {
            return result_1.err('error recipient_node_peer_id');
        }
        if (this.isNotString(recipient_user_peer_id)) {
            return result_1.err('error recipient_user_peer_id');
        }
        if (this.isNotString(info.channel_id)) {
            return result_1.err('empty channel_id');
        }
        if (this.isNotString(info.last_rsmc_temp_address_private_key)) {
            return result_1.err('empty last_rsmc_temp_address_private_key');
        }
        if (this.isNotString(info.last_htlc_temp_address_private_key)) {
            return result_1.err('empty last_htlc_temp_address_private_key');
        }
        if (this.isNotString(info.last_htlc_temp_address_for_htnx_private_key)) {
            return result_1.err('empty last_htlc_temp_address_private_key');
        }
        if (this.isNotString(info.curr_temp_address_pub_key)) {
            return result_1.err('empty curr_rsmc_temp_address_pub_key');
        }
        let msg = new pojo_1.Message();
        msg.type = this.messageType.MsgType_HTLC_SendRequestCloseCurrTx_49;
        msg.data = info;
        msg.recipient_user_peer_id = recipient_user_peer_id;
        msg.recipient_node_peer_id = recipient_node_peer_id;
        return new Promise(async (resolve) => this.sendData(msg, resolve));
    }
    onCloseHTLC(jsonData) { }
    async closeHTLCSigned(recipient_node_peer_id, recipient_user_peer_id, info) {
        if (this.isNotString(recipient_node_peer_id)) {
            return result_1.err('error recipient_node_peer_id');
        }
        if (this.isNotString(recipient_user_peer_id)) {
            return result_1.err('error recipient_user_peer_id');
        }
        if (this.isNotString(info.msg_hash)) {
            return result_1.err('empty msg_hash');
        }
        if (this.isNotString(info.last_rsmc_temp_address_private_key)) {
            return result_1.err('empty last_rsmc_temp_address_private_key');
        }
        if (this.isNotString(info.last_htlc_temp_address_private_key)) {
            return result_1.err('empty last_htlc_temp_address_private_key');
        }
        if (this.isNotString(info.last_htlc_temp_address_for_htnx_private_key)) {
            return result_1.err('empty last_htlc_temp_address_for_htnx_private_key');
        }
        if (this.isNotString(info.curr_temp_address_pub_key)) {
            return result_1.err('empty curr_rsmc_temp_address_pub_key');
        }
        let msg = new pojo_1.Message();
        msg.type = this.messageType.MsgType_HTLC_SendCloseSigned_50;
        msg.recipient_user_peer_id = recipient_user_peer_id;
        msg.recipient_node_peer_id = recipient_node_peer_id;
        msg.data = info;
        return new Promise(async (resolve) => this.sendData(msg, resolve));
    }
    onCloseHTLCSigned(jsonData) { }
    async getTransaction(txid) {
        if (this.isNotString(txid)) {
            return result_1.err('empty txid');
        }
        let msg = new pojo_1.Message();
        msg.type = this.messageType.MsgType_Core_Omni_GetTransaction_2118;
        msg.data['txid'] = txid;
        return new Promise(async (resolve) => this.sendData(msg, resolve));
    }
    onGetTransaction(jsonData) { }
    async issueFixedAmount(info) {
        if (this.isNotString(info.from_address)) {
            return result_1.err('empty from_address');
        }
        if (this.isNotString(info.name)) {
            return result_1.err('empty name');
        }
        if (info.ecosystem == null) {
            return result_1.err('empty ecosystem');
        }
        if (info.divisible_type == null) {
            return result_1.err('empty divisible_type');
        }
        if (info.amount == null || info.amount <= 1) {
            return result_1.err('wrong amount');
        }
        if (this.isNotString(info.data)) {
            info.data = '';
        }
        let msg = new pojo_1.Message();
        msg.type = this.messageType.MsgType_Core_Omni_CreateNewTokenFixed_2113;
        msg.data = info;
        return new Promise(async (resolve) => this.sendData(msg, resolve));
    }
    onIssueFixedAmount(jsonData) { }
    async issueManagedAmout(info) {
        if (this.isNotString(info.from_address)) {
            return result_1.err('empty from_address');
        }
        if (this.isNotString(info.name)) {
            return result_1.err('empty name');
        }
        if (info.ecosystem == null) {
            return result_1.err('empty ecosystem');
        }
        if (info.divisible_type == null) {
            return result_1.err('empty divisible_type');
        }
        if (this.isNotString(info.data)) {
            info.data = '';
        }
        let msg = new pojo_1.Message();
        msg.type = this.messageType.MsgType_Core_Omni_CreateNewTokenManaged_2114;
        msg.data = info;
        return new Promise(async (resolve) => this.sendData(msg, resolve));
    }
    onIssueManagedAmout(jsonData) { }
    async sendGrant(info) {
        if (this.isNotString(info.from_address)) {
            return result_1.err('empty from_address');
        }
        if (info.property_id == null || info.property_id < 1) {
            return result_1.err('empty property_id');
        }
        if (info.amount == null || info.amount <= 0) {
            return result_1.err('wrong amount');
        }
        if (this.isNotString(info.memo)) {
            info.memo = '';
        }
        let msg = new pojo_1.Message();
        msg.type = this.messageType.MsgType_Core_Omni_GrantNewUnitsOfManagedToken_2115;
        msg.data = info;
        return new Promise(async (resolve) => this.sendData(msg, resolve));
    }
    onSendGrant(jsonData) { }
    async sendRevoke(info) {
        if (this.isNotString(info.from_address)) {
            return result_1.err('empty from_address');
        }
        if (info.property_id == null || info.property_id < 1) {
            return result_1.err('empty property_id');
        }
        if (info.amount == null || info.amount <= 0) {
            return result_1.err('wrong amount');
        }
        if (this.isNotString(info.memo)) {
            info.memo = '';
        }
        let msg = new pojo_1.Message();
        msg.type = this.messageType.MsgType_Core_Omni_RevokeUnitsOfManagedToken_2116;
        msg.data = info;
        return new Promise(async (resolve) => this.sendData(msg, resolve));
    }
    onSendRevoke(jsonData) { }
    async getAllBalancesForAddress(address) {
        if (this.isNotString(address)) {
            return result_1.err('empty address');
        }
        let msg = new pojo_1.Message();
        msg.type = this.messageType.MsgType_Core_Omni_Getbalance_2112;
        msg.data['address'] = address;
        return new Promise(async (resolve) => this.sendData(msg, resolve));
    }
    onGetAllBalancesForAddress(jsonData) { }
    async getProperty(propertyId) {
        try {
            if (!propertyId) {
                return result_1.err('empty propertyId');
            }
            if (this.isNotString(propertyId)) {
                propertyId.toString();
            }
            let msg = new pojo_1.Message();
            msg.type = this.messageType.MsgType_Core_Omni_GetProperty_2119;
            msg.data['propertyId'] = propertyId;
            return new Promise(async (resolve) => this.sendData(msg, resolve));
        }
        catch (e) {
            return result_1.err(e);
        }
    }
    onGetProperty(jsonData) { }
    async getBtcBalanceByAddress(address) {
        if (this.isNotString(address)) {
            return result_1.err('empty address');
        }
        let msg = new pojo_1.Message();
        msg.type = this.messageType.MsgType_Core_BalanceByAddress_2108;
        msg.data['address'] = address;
        return new Promise(async (resolve) => this.sendData(msg, resolve));
    }
    onGetBtcBalanceByAddress(jsonData) { }
    async importPrivKey(privkey) {
        if (this.isNotString(privkey)) {
            return result_1.err('empty privkey');
        }
        let msg = new pojo_1.Message();
        msg.type = this.messageType.MsgType_Core_Btc_ImportPrivKey_2111;
        msg.data['privkey'] = privkey;
        return new Promise(async (resolve) => this.sendData(msg, resolve));
    }
    onImportPrivKey(jsonData) { }
    async getAddHTLCRandHInfoList() {
        let msg = new pojo_1.Message();
        return new Promise(async (resolve) => this.sendData(msg, resolve));
    }
    onGetAddHTLCRandHInfoList(jsonData) { }
    async getHtlcSignedRandHInfoList() {
        let msg = new pojo_1.Message();
        return new Promise(async (resolve) => this.sendData(msg, resolve));
    }
    onGetHtlcSignedRandHInfoList(jsonData) { }
    async getRFromCommitmentTx(channel_id) {
        if (this.isNotString(channel_id)) {
            return result_1.err('empty channel_id');
        }
        let msg = new pojo_1.Message();
        msg.data['channel_id'] = channel_id;
        return new Promise(async (resolve) => this.sendData(msg, resolve));
    }
    onGetRFromCommitmentTx(jsonData) { }
    async getPathInfoByH(h) {
        if (this.isNotString(h)) {
            return result_1.err('empty h');
        }
        let msg = new pojo_1.Message();
        msg.data = h;
        return new Promise(async (resolve) => this.sendData(msg, resolve));
    }
    onGetPathInfoByH(jsonData) { }
    async getRByHOfReceiver(h) {
        if (this.isNotString(h)) {
            return result_1.err('empty h');
        }
        let msg = new pojo_1.Message();
        msg.data = h;
        return new Promise(async (resolve) => this.sendData(msg, resolve));
    }
    onGetRByHOfReceiver(jsonData) { }
    async getLatestCommitmentTransaction(channel_id) {
        if (this.isNotString(channel_id)) {
            return result_1.err('empty channel_id');
        }
        let msg = new pojo_1.Message();
        msg.type = this.messageType.MsgType_CommitmentTx_LatestCommitmentTxByChanId_3203;
        msg.data['channel_id'] = channel_id;
        return new Promise(async (resolve) => this.sendData(msg, resolve));
    }
    onGetLatestCommitmentTransaction(jsonData) { }
    async getItemsByChannelId(channel_id) {
        if (this.isNotString(channel_id)) {
            return result_1.err('empty channel_id');
        }
        let msg = new pojo_1.Message();
        msg.type = this.messageType.MsgType_CommitmentTx_ItemsByChanId_3200;
        msg.data['channel_id'] = channel_id;
        return new Promise(async (resolve) => this.sendData(msg, resolve));
    }
    onGetItemsByChannelId(jsonData) { }
    async getMyChannels(page_size, page_index) {
        if (page_size == null || page_size <= 0) {
            page_size = 100;
        }
        if (page_index == null || page_index <= 0) {
            page_index = 1;
        }
        let msg = new pojo_1.Message();
        msg.type = this.messageType.MsgType_ChannelOpen_AllItem_3150;
        msg.data['page_size'] = page_size;
        msg.data['page_index'] = page_index;
        return new Promise(async (resolve) => this.sendData(msg, resolve));
    }
    onGetMyChannels(jsonData) { }
    async getAmountOfRechargeBTC() {
        let msg = new pojo_1.Message();
        msg.type = this.messageType.MsgType_GetMiniBtcFundAmount_2006;
        return new Promise(async (resolve) => this.sendData(msg, resolve));
    }
    onGetAmountOfRechargeBTC(jsonData) { }
    async getChannelDetailFromChannelID(channel_id) {
        if (this.isNotString(channel_id)) {
            return result_1.err('empty channel_id');
        }
        let msg = new pojo_1.Message();
        msg.type = this.messageType.MsgType_GetChannelInfoByChannelId_3154;
        msg.data = channel_id;
        return new Promise(async (resolve) => this.sendData(msg, resolve));
    }
    onGetChannelDetailFromChannelID(jsonData) { }
    async getChannelDetailFromDatabaseID(id) {
        if (id == null || id <= 0) {
            return result_1.err('error id');
        }
        let msg = new pojo_1.Message();
        msg.type = this.messageType.MsgType_GetChannelInfoByDbId_3155;
        msg.data = id;
        return new Promise(async (resolve) => this.sendData(msg, resolve));
    }
    onGetChannelDetailFromDatabaseID(jsonData) { }
    async getAllBreachRemedyTransactions(channel_id) {
        if (this.isNotString(channel_id)) {
            return result_1.err('empty channel_id');
        }
        let msg = new pojo_1.Message();
        msg.type = this.messageType.MsgType_CommitmentTx_AllBRByChanId_3208;
        msg.data['channel_id'] = channel_id;
        return new Promise(async (resolve) => this.sendData(msg, resolve));
    }
    onGetAllBreachRemedyTransactions(jsonData) { }
    async getAllCommitmentTx(channel_id) {
        if (this.isNotString(channel_id)) {
            return result_1.err('empty channel_id');
        }
        let msg = new pojo_1.Message();
        msg.type = this.messageType.MsgType_CommitmentTx_ItemsByChanId_3200;
        msg.data['channel_id'] = channel_id;
        return new Promise(async (resolve) => this.sendData(msg, resolve));
    }
    onGetAllCommitmentTx(jsonData) { }
    async getLatestRevockableDeliveryTransaction(channel_id) {
        if (this.isNotString(channel_id)) {
            return result_1.err('empty channel_id');
        }
        let msg = new pojo_1.Message();
        msg.type = this.messageType.MsgType_CommitmentTx_LatestRDByChanId_3204;
        msg.data['channel_id'] = channel_id;
        return new Promise(async (resolve) => this.sendData(msg, resolve));
    }
    onGetLatestRevockableDeliveryTransaction(jsonData) { }
    async getLatestBreachRemedyTransaction(channel_id) {
        if (this.isNotString(channel_id)) {
            return result_1.err('empty channel_id');
        }
        let msg = new pojo_1.Message();
        msg.type = this.messageType.MsgType_CommitmentTx_LatestBRByChanId_3205;
        msg.data['channel_id'] = channel_id;
        return new Promise(async (resolve) => this.sendData(msg, resolve));
    }
    onGetLatestBreachRemedyTransaction(jsonData) { }
    async sendSomeCommitmentById(id) {
        if (id == null || id < 0) {
            return result_1.err('error id');
        }
        let msg = new pojo_1.Message();
        msg.type = this.messageType.MsgType_CommitmentTx_SendSomeCommitmentById_3206;
        msg.data = id;
        return new Promise(async (resolve) => this.sendData(msg, resolve));
    }
    onSendSomeCommitmentById(jsonData) { }
    async getAllRevockableDeliveryTransactions(channel_id) {
        if (this.isNotString(channel_id)) {
            return result_1.err('empty channel_id');
        }
        let msg = new pojo_1.Message();
        msg.type = this.messageType.MsgType_CommitmentTx_AllRDByChanId_3207;
        msg.data['channel_id'] = channel_id;
        return new Promise(async (resolve) => this.sendData(msg, resolve));
    }
    onGetAllRevockableDeliveryTransactions(jsonData) { }
    async closeChannel(recipient_node_peer_id, recipient_user_peer_id, channel_id) {
        if (this.isNotString(recipient_node_peer_id)) {
            return result_1.err('error recipient_node_peer_id');
        }
        if (this.isNotString(recipient_user_peer_id)) {
            return result_1.err('error recipient_user_peer_id');
        }
        if (this.isNotString(channel_id)) {
            return result_1.err('empty channel_id');
        }
        let msg = new pojo_1.Message();
        msg.type = this.messageType.MsgType_SendCloseChannelRequest_38;
        msg.data['channel_id'] = channel_id;
        msg.recipient_user_peer_id = recipient_user_peer_id;
        msg.recipient_node_peer_id = recipient_node_peer_id;
        return new Promise(async (resolve) => this.sendData(msg, resolve));
    }
    onCloseChannel(jsonData) { }
    async closeChannelSigned(recipient_node_peer_id, recipient_user_peer_id, info) {
        if (this.isNotString(recipient_node_peer_id)) {
            return result_1.err('error recipient_node_peer_id');
        }
        if (this.isNotString(recipient_user_peer_id)) {
            return result_1.err('error recipient_user_peer_id');
        }
        if (this.isNotString(info.channel_id)) {
            return result_1.err('empty channel_id');
        }
        if (info.approval == null) {
            info.approval = false;
        }
        if (info.approval) {
            if (this.isNotString(info.request_close_channel_hash)) {
                return result_1.err('empty request_close_channel_hash');
            }
        }
        let msg = new pojo_1.Message();
        msg.type = this.messageType.MsgType_SendCloseChannelSign_39;
        msg.data = info;
        msg.recipient_user_peer_id = recipient_user_peer_id;
        msg.recipient_node_peer_id = recipient_node_peer_id;
        return new Promise(async (resolve) => this.sendData(msg, resolve));
    }
    onCloseChannelSigned(jsonData) { }
    async atomicSwap(recipient_node_peer_id, recipient_user_peer_id, info) {
        if (this.isNotString(recipient_node_peer_id)) {
            return result_1.err('error recipient_node_peer_id');
        }
        if (this.isNotString(recipient_user_peer_id)) {
            return result_1.err('error recipient_user_peer_id');
        }
        if (this.isNotString(info.channel_id_from)) {
            return result_1.err('empty channel_id_from');
        }
        if (this.isNotString(info.channel_id_to)) {
            return result_1.err('empty channel_id_to');
        }
        if (this.isNotString(info.recipient_user_peer_id)) {
            return result_1.err('empty recipient_user_peer_id');
        }
        if (this.isNotString(info.transaction_id)) {
            return result_1.err('empty transaction_id');
        }
        if (info.property_sent <= 0) {
            return result_1.err('wrong property_sent');
        }
        if (info.amount <= 0) {
            return result_1.err('wrong amount');
        }
        if (info.exchange_rate <= 0) {
            return result_1.err('wrong exchange_rate');
        }
        if (info.property_received <= 0) {
            return result_1.err('wrong property_received');
        }
        let msg = new pojo_1.Message();
        msg.type = this.messageType.MsgType_Atomic_SendSwap_80;
        msg.data = info;
        msg.recipient_user_peer_id = recipient_user_peer_id;
        msg.recipient_node_peer_id = recipient_node_peer_id;
        return new Promise(async (resolve) => this.sendData(msg, resolve));
    }
    async atomicSwapAccepted(recipient_node_peer_id, recipient_user_peer_id, info) {
        if (this.isNotString(recipient_node_peer_id)) {
            return result_1.err('error recipient_node_peer_id');
        }
        if (this.isNotString(recipient_user_peer_id)) {
            return result_1.err('error recipient_user_peer_id');
        }
        if (this.isNotString(info.channel_id_from)) {
            return result_1.err('empty channel_id_from');
        }
        if (this.isNotString(info.channel_id_to)) {
            return result_1.err('empty channel_id_to');
        }
        if (this.isNotString(info.recipient_user_peer_id)) {
            return result_1.err('empty recipient_user_peer_id');
        }
        if (this.isNotString(info.transaction_id)) {
            return result_1.err('empty transaction_id');
        }
        if (this.isNotString(info.target_transaction_id)) {
            return result_1.err('empty target_transaction_id');
        }
        if (info.property_sent <= 0) {
            return result_1.err('wrong property_sent');
        }
        if (info.amount <= 0) {
            return result_1.err('wrong amount');
        }
        if (info.exchange_rate <= 0) {
            return result_1.err('wrong exchange_rate');
        }
        if (info.property_received <= 0) {
            return result_1.err('wrong property_received');
        }
        let msg = new pojo_1.Message();
        msg.type = this.messageType.MsgType_Atomic_SendSwapAccept_81;
        msg.data = info;
        msg.recipient_user_peer_id = recipient_user_peer_id;
        msg.recipient_node_peer_id = recipient_node_peer_id;
        return new Promise(async (resolve) => this.sendData(msg, resolve));
    }
    isNotString(str) {
        return !str || typeof str !== 'string';
    }
    listener(id, method, data = '') {
        if (this?.listeners &&
            id in this.listeners &&
            method in this.listeners[id]) {
            this.listeners[id][method](data);
        }
        if (method === 'failure')
            return result_1.err(data);
        return result_1.ok(data);
    }
    updateOmniboltCheckpoint({ channelId, checkpoint, data, }, save = true) {
        try {
            this.data.checkpoints[channelId] = {
                checkpoint,
                data,
            };
            if (save)
                this.saveData(this.data);
        }
        catch (e) {
            this.logMsg('updateOmniboltCheckpoint error', e);
        }
    }
    clearOmniboltCheckpoint({ channelId }) {
        try {
            if ('checkpoints' in this.data && channelId in this.data.checkpoints) {
                delete this.data.checkpoints[channelId];
            }
        }
        catch (e) {
            this.logMsg('clearOmniboltCheckpoint', e);
        }
    }
    async resumeFromCheckpoints() {
        const checkpoints = this.data.checkpoints ?? {};
        await Promise.all(Object.keys(checkpoints).map((channelId) => {
            const id = checkpoints[channelId].checkpoint;
            switch (id) {
                case 'onChannelOpenAttempt':
                    const onChannelOpenAttemptData = checkpoints[channelId].data;
                    this.onChannelOpenAttempt(onChannelOpenAttemptData).then();
                    break;
                case 'onBitcoinFundingCreated':
                    const onBitcoinFundingCreatedData = checkpoints[channelId].data;
                    this.onBitcoinFundingCreated(onBitcoinFundingCreatedData).then();
                    break;
                case 'onAssetFundingCreated':
                    const onAssetFundingCreatedData = checkpoints[channelId].data;
                    this.onAssetFundingCreated(onAssetFundingCreatedData).then();
                    break;
                case 'on110352':
                    const on110352Data = checkpoints[channelId].data;
                    this.on110352(on110352Data);
                    break;
                case 'on110353':
                    const on110353Data = checkpoints[channelId].data;
                    this.on110353(on110353Data);
                    break;
                case 'sendSignedHex100363':
                    const sendSignedHex100363Data = checkpoints[channelId].data;
                    this.handleSendSignedHex100363(sendSignedHex100363Data);
                    break;
                case 'sendSignedHex101035':
                    const sendSignedHex101035Data = checkpoints[channelId].data;
                    this.sendSignedHex101035({
                        recipient_node_peer_id: sendSignedHex101035Data.funder_node_address,
                        recipient_user_peer_id: sendSignedHex101035Data.funder_peer_id,
                        data: sendSignedHex101035Data.result,
                        channelId,
                    });
                    break;
                case 'onCommitmentTransactionCreated':
                    this.onCommitmentTransactionCreated(checkpoints[channelId].data);
                    break;
            }
        }));
    }
    getInfo() {
        return this.loginData;
    }
    async getNewSigningAddress() {
        const nextOmniboltAddress = await utils_1.getNextOmniboltAddress({
            addressIndex: this.data.nextAddressIndex,
            selectedNetwork: this.selectedNetwork,
            mnemonic: this.mnemonic,
        });
        if (nextOmniboltAddress.isErr()) {
            return result_1.err(nextOmniboltAddress.error.message);
        }
        const addressIndex = this.data.nextAddressIndex;
        this.data.nextAddressIndex = nextOmniboltAddress.value;
        this.saveData(this.data);
        return result_1.ok(addressIndex);
    }
    async getFundingAddressByIndex({ index, }) {
        const fundingAddress = await utils_1.generateFundingAddress({
            index,
            selectedNetwork: this.selectedNetwork,
            mnemonic: this.mnemonic,
        });
        if (fundingAddress.isErr()) {
            return result_1.err(fundingAddress.error.message);
        }
        return result_1.ok(fundingAddress.value);
    }
    getConnectUri() {
        if (!this.isLoggedIn) {
            return result_1.err('Please login first.');
        }
        const action = 'connect';
        const { nodeAddress, userPeerId } = this.loginData;
        const data = {
            remote_node_address: nodeAddress,
            recipient_user_peer_id: userPeerId,
        };
        const response = utils_1.generateOmniboltUri({ action, data });
        if (response.isErr()) {
            return result_1.err(response.error.message);
        }
        return result_1.ok(response.value);
    }
}
exports.default = ObdApi;
//# sourceMappingURL=obdapi.js.map