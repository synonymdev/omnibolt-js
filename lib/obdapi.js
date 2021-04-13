"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pojo_1 = require("./pojo");
const result_1 = require("./result");
const DEFAULT_URL = "62.234.216.108:60020";
class ObdApi {
    constructor({ url = DEFAULT_URL } = {}) {
        this.isConnectedToOBD = false;
        this.isLoggedIn = false;
        this.messageType = new pojo_1.MessageType();
        this.callbackMap = new Map();
        this.loginData = {
            nodeAddress: "",
            nodePeerId: "",
            userPeerId: ""
        };
        this.userPeerId = "";
        this.defaultUrl = url;
    }
    connect({ url = undefined, onOpen, onMessage, onChannelOpenAttempt, onAcceptChannel, onBitcoinFundingCreated, onAssetFundingCreated, onCommitmentTransactionCreated, onChannelClose, onError, onClose, onAddHTLC, onForwardR, onSignR, onCloseHTLC }) {
        return new Promise((resolve) => {
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
            this.ws = new WebSocket(`ws://${this.defaultUrl}/wstest`);
            if (onMessage !== undefined)
                this.onMessage = onMessage;
            if (onOpen !== undefined)
                this.onOpen = onOpen;
            if (onChannelOpenAttempt !== undefined)
                this.onChannelOpenAttempt = onChannelOpenAttempt;
            if (onAcceptChannel !== undefined)
                this.onAcceptChannel = onAcceptChannel;
            if (onBitcoinFundingCreated !== undefined)
                this.onBitcoinFundingCreated = onBitcoinFundingCreated;
            if (onAssetFundingCreated !== undefined)
                this.onAssetFundingCreated = onAssetFundingCreated;
            if (onCommitmentTransactionCreated !== undefined)
                this.onCommitmentTransactionCreated = onCommitmentTransactionCreated;
            if (onChannelClose !== undefined)
                this.onChannelClose = onChannelClose;
            if (onAddHTLC !== undefined)
                this.onAddHTLC = onAddHTLC;
            if (onForwardR !== undefined)
                this.onForwardR = onForwardR;
            if (onSignR !== undefined)
                this.onSignR = onSignR;
            if (onCloseHTLC !== undefined)
                this.onCloseHTLC = onCloseHTLC;
            this.ws.onopen = () => {
                if (this.onMessage)
                    this.onMessage(`Connected to ${url}`);
                this.isConnectedToOBD = true;
                onOpen(url);
            };
            this.ws.onmessage = (e) => {
                try {
                    const jsonData = JSON.parse(e.data);
                    this.getDataFromServer(jsonData);
                    if (this.onMessage)
                        this.onMessage(jsonData);
                    if (jsonData.type == -110032) {
                        if (this.onChannelOpenAttempt)
                            this.onChannelOpenAttempt(jsonData);
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
                    if (jsonData.type == -110038) {
                        if (this.onChannelClose)
                            this.onChannelClose(jsonData);
                    }
                    if (jsonData.type == -110040) {
                        this.onAddHTLC(jsonData);
                    }
                    if (jsonData.type == -100041) {
                    }
                    console.log(e);
                    resolve(result_1.ok(jsonData));
                }
                catch (e) {
                    console.log(e);
                    if (this.onMessage)
                        this.onMessage(e);
                    resolve(result_1.err(e));
                }
            };
            this.ws.onerror = (e) => {
                console.log("Error!");
                console.log(e);
                this.disconnect();
                onError(e.message);
                resolve(result_1.err(e.message));
            };
            this.ws.onclose = (e) => {
                console.log("Closing Up!");
                this.disconnect();
                onClose(e.code, e.reason);
            };
        });
    }
    registerEvent(msgType, callback) {
        if (callback == null) {
            console.info("callback function is null");
            return;
        }
        if (msgType == null) {
            callback("msgType is null");
            return;
        }
        this.callbackMap[msgType] = callback;
    }
    removeEvent(msgType) {
        this.callbackMap.delete(msgType);
    }
    sendJsonData(msg, type, callback) {
        if (!this.isConnectedToOBD) {
            console.log("please try to connect obd again");
            return;
        }
        if (this.isNotString(msg)) {
            console.log("error request content.");
            return;
        }
        if (callback !== null) {
            this.callbackMap[type] = callback;
        }
        this.ws.send(msg);
    }
    connectToServer(url, callback, globalCallback) {
        if (this.isConnectedToOBD) {
            console.info("already connected");
            if (callback)
                callback("already connected");
            return;
        }
        this.globalCallback = globalCallback;
        if (url !== null && url.length > 0) {
            this.defaultUrl = url;
        }
        console.info("connect to " + this.defaultUrl);
        try {
            this.ws = new WebSocket(this.defaultUrl);
            this.ws.onopen = (e) => {
                console.info(e);
                console.info("connect success");
                if (callback !== null) {
                    callback("connect success");
                }
                this.isConnectedToOBD = true;
            };
            this.ws.onmessage = (e) => {
                let jsonData = JSON.parse(e.data);
                console.info(jsonData);
                this.getDataFromServer(jsonData);
            };
            this.ws.onclose = (e) => {
                console.info("ws close", e);
                this.isConnectedToOBD = false;
                this.isLoggedIn = false;
                return result_1.err("ws close");
            };
            this.ws.onerror = (e) => {
                console.info("ws error", e);
                return result_1.err("ws error");
            };
        }
        catch (e) {
            console.info(e);
            return result_1.err(e);
        }
    }
    sendData(msg, callback) {
        if (!this.isConnectedToOBD) {
            return result_1.err("please try to connect obd again");
        }
        if (((msg.type <= -100000 && msg.type >= -102000) ||
            (msg.type <= -103000 && msg.type >= -104000)) &&
            this.isLoggedIn == false) {
            return result_1.err("please login");
        }
        console.info(new Date(), "----------------------------send msg------------------------------");
        console.info(msg);
        if (callback !== null) {
            this.callbackMap[msg.type] = callback;
        }
        this.ws.send(JSON.stringify(msg));
    }
    getDataFromServer(jsonData) {
        console.info(jsonData);
        if (this.globalCallback)
            this.globalCallback(jsonData);
        let callback = this.callbackMap[jsonData.type];
        if (jsonData.type == 0)
            return;
        if (jsonData.status == false) {
            if (jsonData.type == this.messageType.MsgType_Core_Omni_Getbalance_2112) {
                try {
                    if (callback != null)
                        return callback(result_1.err("Omni Error"));
                }
                catch {
                    return result_1.err(jsonData);
                }
            }
            if (jsonData.type !== this.messageType.MsgType_Error_0) {
                console.log(jsonData.result);
            }
            try {
                if (callback != null)
                    return callback(result_1.err(jsonData));
            }
            catch {
                return result_1.err(jsonData);
            }
            return result_1.err(jsonData);
        }
        let resultData = jsonData.result;
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
        fromId = fromId.split("@")[0];
        toId = toId.split("@")[0];
        if (fromId !== toId) {
            if (callback !== null) {
                resultData["to_peer_id"] = toId;
                try {
                    return callback(result_1.ok(resultData));
                }
                catch {
                    return result_1.err(jsonData);
                }
            }
            return;
        }
        if (callback != null)
            callback(result_1.ok(resultData));
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
            return result_1.err("You are already logged in!");
        }
        if (this.isNotString(mnemonic)) {
            return result_1.err("empty mnemonic");
        }
        let msg = new pojo_1.Message();
        msg.type = this.messageType.MsgType_UserLogin_2001;
        msg.data["mnemonic"] = mnemonic;
        return new Promise(async (resolve) => this.sendData(msg, resolve));
    }
    onLogIn(resultData) {
        if (!this.isLoggedIn)
            this.isLoggedIn = true;
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
            return result_1.ok("You have logged out.");
        }
    }
    onLogout(jsonData) {
        this.isLoggedIn = false;
    }
    async connectPeer(info) {
        if (this.isNotString(info.remote_node_address)) {
            return result_1.err("Empty remote_node_address");
        }
        let msg = new pojo_1.Message();
        msg.data = info;
        msg.type = this.messageType.MsgType_p2p_ConnectPeer_2003;
        return new Promise((resolve) => this.sendData(msg, resolve));
    }
    async fundingBitcoin(info) {
        if (this.isNotString(info.from_address)) {
            return result_1.err("empty from_address");
        }
        if (this.isNotString(info.to_address)) {
            return result_1.err("empty to_address");
        }
        if (info.amount == null || info.amount <= 0) {
            return result_1.err("wrong amount");
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
            return result_1.err("error recipient_node_peer_id");
        }
        if (this.isNotString(recipient_user_peer_id)) {
            return result_1.err("error recipient_user_peer_id");
        }
        if (this.isNotString(info.temporary_channel_id)) {
            return result_1.err("empty temporary_channel_id");
        }
        if (this.isNotString(info.funding_tx_hex)) {
            return result_1.err("empty funding_tx_hex");
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
            return result_1.err("error recipient_node_peer_id");
        }
        if (this.isNotString(recipient_user_peer_id)) {
            return result_1.err("error recipient_user_peer_id");
        }
        let msg = new pojo_1.Message();
        msg.type = this.messageType.MsgType_FundingCreate_BtcFundingMinerRDTxToClient_341;
        msg.recipient_user_peer_id = recipient_user_peer_id;
        msg.recipient_node_peer_id = recipient_node_peer_id;
        msg.data["hex"] = signed_hex;
        return new Promise(async (resolve) => this.sendData(msg, resolve));
    }
    async bitcoinFundingSigned(recipient_node_peer_id, recipient_user_peer_id, info) {
        if (this.isNotString(recipient_node_peer_id)) {
            return result_1.err("error recipient_node_peer_id");
        }
        if (this.isNotString(recipient_user_peer_id)) {
            return result_1.err("error recipient_user_peer_id");
        }
        if (this.isNotString(info.temporary_channel_id)) {
            return result_1.err("empty temporary_channel_id");
        }
        if (this.isNotString(info.funding_txid)) {
            return result_1.err("empty funding_txid");
        }
        if (this.isNotString(info.signed_miner_redeem_transaction_hex)) {
            return result_1.err("empty signed_miner_redeem_transaction_hex");
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
            return result_1.err("empty from_address");
        }
        if (this.isNotString(info.to_address)) {
            return result_1.err("empty to_address");
        }
        if (info.property_id == null || info.property_id <= 0) {
            return result_1.err("error property_id");
        }
        if (info.amount == null || info.amount <= 0) {
            return result_1.err("Incorrect amount");
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
            return result_1.err("empty from_address");
        }
        if (this.isNotString(info.to_address)) {
            return result_1.err("empty to_address");
        }
        if (info.property_id == null || info.property_id <= 0) {
            return result_1.err("error property_id");
        }
        if (info.amount == null || info.amount <= 0) {
            return result_1.err("wrong amount");
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
            return result_1.err("error index");
        }
        let msg = new pojo_1.Message();
        msg.type = this.messageType.MsgType_Mnemonic_GetAddressByIndex_3001;
        msg.data = index;
        return new Promise(async (resolve) => this.sendData(msg, resolve));
    }
    onGetAddressInfo(jsonData) { }
    async openChannel(recipient_node_peer_id, recipient_user_peer_id, info) {
        if (this.isNotString(recipient_node_peer_id)) {
            return result_1.err("error recipient_node_peer_id");
        }
        if (this.isNotString(recipient_user_peer_id)) {
            return result_1.err("error recipient_user_peer_id");
        }
        if (this.isNotString(info.funding_pubkey)) {
            return result_1.err("error funding_pubkey");
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
    onOpenChannel(jsonData) { }
    async acceptChannel(recipient_node_peer_id, recipient_user_peer_id, info) {
        if (this.isNotString(recipient_node_peer_id)) {
            return result_1.err("error recipient_node_peer_id");
        }
        if (this.isNotString(recipient_user_peer_id)) {
            return result_1.err("error recipient_user_peer_id");
        }
        if (this.isNotString(info.temporary_channel_id)) {
            return result_1.err("empty temporary_channel_id");
        }
        if (info.approval == null) {
            info.approval = false;
        }
        if (info.approval) {
            if (this.isNotString(info.funding_pubkey)) {
                return result_1.err("empty funding_pubkey");
            }
        }
        let msg = new pojo_1.Message();
        msg.type = this.messageType.MsgType_SendChannelAccept_33;
        msg.recipient_node_peer_id = recipient_node_peer_id;
        msg.recipient_user_peer_id = recipient_user_peer_id;
        msg.data = info;
        return new Promise(async (resolve) => this.sendData(msg, resolve));
    }
    async checkChannelAddessExist(recipient_node_peer_id, recipient_user_peer_id, info) {
        if (this.isNotString(recipient_node_peer_id)) {
            return result_1.err("error recipient_node_peer_id");
        }
        if (this.isNotString(recipient_user_peer_id)) {
            return result_1.err("error recipient_user_peer_id");
        }
        if (this.isNotString(info.temporary_channel_id)) {
            return result_1.err("empty temporary_channel_id");
        }
        if (info.approval == null) {
            info.approval = false;
        }
        if (info.approval) {
            if (this.isNotString(info.funding_pubkey)) {
                return result_1.err("empty funding_pubkey");
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
            return result_1.err("error recipient_node_peer_id");
        }
        if (this.isNotString(recipient_user_peer_id)) {
            return result_1.err("error recipient_user_peer_id");
        }
        if (this.isNotString(info.temporary_channel_id)) {
            return result_1.err("empty temporary_channel_id");
        }
        if (this.isNotString(info.funding_tx_hex)) {
            return result_1.err("empty funding_tx_hex");
        }
        if (this.isNotString(info.temp_address_pub_key)) {
            return result_1.err("empty temp_address_pub_key");
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
            return result_1.err("error recipient_node_peer_id");
        }
        if (this.isNotString(recipient_user_peer_id)) {
            return result_1.err("error recipient_user_peer_id");
        }
        let msg = new pojo_1.Message();
        msg.type = this.messageType.MsgType_ClientSign_AssetFunding_AliceSignC1a_1034;
        msg.recipient_user_peer_id = recipient_user_peer_id;
        msg.recipient_node_peer_id = recipient_node_peer_id;
        msg.data["signed_c1a_hex"] = signed_hex;
        return new Promise(async (resolve) => this.sendData(msg, resolve));
    }
    async sendSignedHex101134(info) {
        if (this.isNotString(info.channel_id)) {
            return result_1.err("empty channel_id");
        }
        let msg = new pojo_1.Message();
        msg.type = this.messageType.MsgType_ClientSign_AssetFunding_AliceSignRD_1134;
        msg.data = info;
        return new Promise(async (resolve) => this.sendData(msg, resolve));
    }
    async assetFundingSigned(recipient_node_peer_id, recipient_user_peer_id, info) {
        if (this.isNotString(recipient_node_peer_id)) {
            return result_1.err("error recipient_node_peer_id");
        }
        if (this.isNotString(recipient_user_peer_id)) {
            return result_1.err("error recipient_user_peer_id");
        }
        if (this.isNotString(info.temporary_channel_id)) {
            return result_1.err("empty temporary_channel_id");
        }
        if (this.isNotString(info.signed_alice_rsmc_hex)) {
            return result_1.err("empty signed_alice_rsmc_hex");
        }
        let msg = new pojo_1.Message();
        msg.type = this.messageType.MsgType_FundingSign_SendAssetFundingSigned_35;
        msg.recipient_user_peer_id = recipient_user_peer_id;
        msg.recipient_node_peer_id = recipient_node_peer_id;
        msg.data = info;
        return new Promise(async (resolve) => this.sendData(msg, resolve));
    }
    onAssetFundingSigned(jsonData) { }
    async sendSignedHex101035(recipient_node_peer_id, recipient_user_peer_id, info) {
        if (this.isNotString(recipient_node_peer_id)) {
            return result_1.err("error recipient_node_peer_id");
        }
        if (this.isNotString(recipient_user_peer_id)) {
            return result_1.err("error recipient_user_peer_id");
        }
        if (this.isNotString(info.temporary_channel_id)) {
            return result_1.err("empty temporary_channel_id");
        }
        let msg = new pojo_1.Message();
        msg.type = this.messageType.MsgType_ClientSign_Duplex_AssetFunding_RdAndBr_1035;
        msg.recipient_user_peer_id = recipient_user_peer_id;
        msg.recipient_node_peer_id = recipient_node_peer_id;
        msg.data = info;
        return new Promise(async (resolve) => this.sendData(msg, resolve));
    }
    async commitmentTransactionCreated(recipient_node_peer_id, recipient_user_peer_id, info) {
        if (this.isNotString(recipient_node_peer_id)) {
            return result_1.err("error recipient_node_peer_id");
        }
        if (this.isNotString(recipient_user_peer_id)) {
            return result_1.err("error recipient_user_peer_id");
        }
        if (this.isNotString(info.channel_id)) {
            return result_1.err("empty channel_id");
        }
        if (this.isNotString(info.curr_temp_address_pub_key)) {
            return result_1.err("empty curr_temp_address_pub_key");
        }
        if (info.amount == null || info.amount <= 0) {
            return result_1.err("wrong amount");
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
            return result_1.err("error recipient_node_peer_id");
        }
        if (this.isNotString(recipient_user_peer_id)) {
            return result_1.err("error recipient_user_peer_id");
        }
        if (this.isNotString(info.channel_id)) {
            return result_1.err("empty channel_id");
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
            return result_1.err("error recipient_node_peer_id");
        }
        if (this.isNotString(recipient_user_peer_id)) {
            return result_1.err("error recipient_user_peer_id");
        }
        if (this.isNotString(info.channel_id)) {
            return result_1.err("empty channel_id");
        }
        if (this.isNotString(info.msg_hash)) {
            return result_1.err("empty msg_hash");
        }
        if (info.approval == null) {
            info.approval = false;
        }
        if (info.approval == true) {
            if (this.isNotString(info.curr_temp_address_pub_key)) {
                return result_1.err("empty curr_temp_address_pub_key");
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
            return result_1.err("error recipient_node_peer_id");
        }
        if (this.isNotString(recipient_user_peer_id)) {
            return result_1.err("error recipient_user_peer_id");
        }
        if (this.isNotString(info.channel_id)) {
            return result_1.err("empty channel_id");
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
            return result_1.err("error recipient_node_peer_id");
        }
        if (this.isNotString(recipient_user_peer_id)) {
            return result_1.err("error recipient_user_peer_id");
        }
        if (this.isNotString(info.channel_id)) {
            return result_1.err("empty channel_id");
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
            return result_1.err("error recipient_node_peer_id");
        }
        if (this.isNotString(recipient_user_peer_id)) {
            return result_1.err("error recipient_user_peer_id");
        }
        if (this.isNotString(info.channel_id)) {
            return result_1.err("empty channel_id");
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
            return result_1.err("empty channel_id");
        }
        let msg = new pojo_1.Message();
        msg.type = this.messageType.MsgType_ClientSign_CommitmentTx_BobSignC2b_Rd_364;
        msg.data = info;
        return new Promise(async (resolve) => this.sendData(msg, resolve));
    }
    async addInvoice(info) {
        if (info.property_id == null || info.property_id <= 0) {
            return result_1.err("empty property_id");
        }
        if (info.amount == null || info.amount <= 0) {
            return result_1.err("wrong amount");
        }
        if (this.isNotString(info.h)) {
            return result_1.err("empty h");
        }
        if (this.isNotString(info.expiry_time)) {
            return result_1.err("empty expiry_time");
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
                return result_1.err("empty property_id");
            }
            if (info.amount == null || info.amount < 0.001) {
                return result_1.err("wrong amount");
            }
            if (this.isNotString(info.h)) {
                return result_1.err("empty h");
            }
            if (this.isNotString(info.expiry_time)) {
                return result_1.err("empty expiry_time");
            }
        }
        else if (this.isNotString(info.invoice)) {
            return result_1.err("empty invoice");
        }
        let msg = new pojo_1.Message();
        msg.type = this.messageType.MsgType_HTLC_FindPath_401;
        msg.data = info;
        return new Promise(async (resolve) => this.sendData(msg, resolve));
    }
    onHTLCFindPath(jsonData) { }
    async addHTLC(recipient_node_peer_id, recipient_user_peer_id, info) {
        if (this.isNotString(recipient_node_peer_id)) {
            return result_1.err("error recipient_node_peer_id");
        }
        if (this.isNotString(recipient_user_peer_id)) {
            return result_1.err("error recipient_user_peer_id");
        }
        if (this.isNotString(info.h)) {
            return result_1.err("empty h");
        }
        if (info.property_id <= 0) {
            return result_1.err("wrong property_id");
        }
        if (info.amount <= 0) {
            return result_1.err("wrong amount");
        }
        if (this.isNotString(info.memo)) {
            info.memo = "";
        }
        if (this.isNotString(info.routing_packet)) {
            return result_1.err("empty routing_packet");
        }
        if (info.cltv_expiry <= 0) {
            return result_1.err("wrong cltv_expiry");
        }
        if (this.isNotString(info.last_temp_address_private_key)) {
            return result_1.err("empty last_temp_address_private_key");
        }
        if (this.isNotString(info.curr_rsmc_temp_address_pub_key)) {
            return result_1.err("empty curr_rsmc_temp_address_pub_key");
        }
        if (this.isNotString(info.curr_htlc_temp_address_pub_key)) {
            return result_1.err("empty curr_htlc_temp_address_pub_key");
        }
        if (this.isNotString(info.curr_htlc_temp_address_for_ht1a_pub_key)) {
            return result_1.err("empty curr_htlc_temp_address_for_ht1a_pub_key");
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
            return result_1.err("error recipient_node_peer_id");
        }
        if (this.isNotString(recipient_user_peer_id)) {
            return result_1.err("error recipient_user_peer_id");
        }
        if (this.isNotString(info.channel_id)) {
            return result_1.err("empty channel_id");
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
            return result_1.err("error recipient_node_peer_id");
        }
        if (this.isNotString(recipient_user_peer_id)) {
            return result_1.err("error recipient_user_peer_id");
        }
        if (this.isNotString(info.channel_id)) {
            return result_1.err("empty channel_id");
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
            return result_1.err("empty channel_id");
        }
        let msg = new pojo_1.Message();
        msg.type = this.messageType.MsgType_HTLC_ClientSign_Alice_C3b_102;
        msg.data = info;
        return new Promise(async (resolve) => this.sendData(msg, resolve));
    }
    async sendSignedHex100103(recipient_node_peer_id, recipient_user_peer_id, info) {
        if (this.isNotString(recipient_node_peer_id)) {
            return result_1.err("error recipient_node_peer_id");
        }
        if (this.isNotString(recipient_user_peer_id)) {
            return result_1.err("error recipient_user_peer_id");
        }
        if (this.isNotString(info.channel_id)) {
            return result_1.err("empty channel_id");
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
            return result_1.err("empty channel_id");
        }
        if (this.isNotString(info.curr_htlc_temp_address_for_he_pub_key)) {
            return result_1.err("empty curr_htlc_temp_address_for_he_pub_key");
        }
        let msg = new pojo_1.Message();
        msg.type = this.messageType.MsgType_HTLC_ClientSign_Bob_C3bSub_104;
        msg.data = info;
        return new Promise(async (resolve) => this.sendData(msg, resolve));
    }
    sendSignedHex100105(recipient_node_peer_id, recipient_user_peer_id, info) {
        if (this.isNotString(recipient_node_peer_id)) {
            return result_1.err("error recipient_node_peer_id");
        }
        if (this.isNotString(recipient_user_peer_id)) {
            return result_1.err("error recipient_user_peer_id");
        }
        if (this.isNotString(info.channel_id)) {
            return result_1.err("empty channel_id");
        }
        let msg = new pojo_1.Message();
        msg.type = this.messageType.MsgType_HTLC_ClientSign_Alice_He_105;
        msg.recipient_user_peer_id = recipient_user_peer_id;
        msg.recipient_node_peer_id = recipient_node_peer_id;
        msg.data = info;
        return new Promise(async (resolve) => this.sendData(msg, resolve));
    }
    sendSignedHex100106(recipient_node_peer_id, recipient_user_peer_id, info) {
        if (this.isNotString(recipient_node_peer_id)) {
            return result_1.err("error recipient_node_peer_id");
        }
        if (this.isNotString(recipient_user_peer_id)) {
            return result_1.err("error recipient_user_peer_id");
        }
        if (this.isNotString(info.channel_id)) {
            return result_1.err("empty channel_id");
        }
        let msg = new pojo_1.Message();
        msg.type = this.messageType.MsgType_HTLC_ClientSign_Bob_HeSub_106;
        msg.recipient_user_peer_id = recipient_user_peer_id;
        msg.recipient_node_peer_id = recipient_node_peer_id;
        msg.data = info;
        return new Promise(async (resolve) => this.sendData(msg, resolve));
    }
    sendSignedHex100110(recipient_node_peer_id, recipient_user_peer_id, info) {
        if (this.isNotString(recipient_node_peer_id)) {
            return result_1.err("error recipient_node_peer_id");
        }
        if (this.isNotString(recipient_user_peer_id)) {
            return result_1.err("error recipient_user_peer_id");
        }
        if (this.isNotString(info.channel_id)) {
            return result_1.err("empty channel_id");
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
            return result_1.err("error recipient_node_peer_id");
        }
        if (this.isNotString(recipient_user_peer_id)) {
            return result_1.err("error recipient_user_peer_id");
        }
        if (this.isNotString(info.channel_id)) {
            return result_1.err("empty channel_id");
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
            return result_1.err("empty channel_id");
        }
        let msg = new pojo_1.Message();
        msg.type = this.messageType.MsgType_HTLC_Close_ClientSign_Alice_C4b_112;
        msg.data = info;
        return new Promise(async (resolve) => this.sendData(msg, resolve));
    }
    async sendSignedHex100113(recipient_node_peer_id, recipient_user_peer_id, info) {
        if (this.isNotString(recipient_node_peer_id)) {
            return result_1.err("error recipient_node_peer_id");
        }
        if (this.isNotString(recipient_user_peer_id)) {
            return result_1.err("error recipient_user_peer_id");
        }
        if (this.isNotString(info.channel_id)) {
            return result_1.err("empty channel_id");
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
            return result_1.err("empty channel_id");
        }
        let msg = new pojo_1.Message();
        msg.type = this.messageType.MsgType_HTLC_Close_ClientSign_Bob_C4bSubResult_114;
        msg.data = info;
        return new Promise(async (resolve) => this.sendData(msg, resolve));
    }
    async htlcSigned(recipient_node_peer_id, recipient_user_peer_id, info) {
        if (this.isNotString(recipient_node_peer_id)) {
            return result_1.err("error recipient_node_peer_id");
        }
        if (this.isNotString(recipient_user_peer_id)) {
            return result_1.err("error recipient_user_peer_id");
        }
        if (this.isNotString(info.payer_commitment_tx_hash)) {
            return result_1.err("empty payer_commitment_tx_hash");
        }
        if (this.isNotString(info.curr_rsmc_temp_address_pub_key)) {
            return result_1.err("empty curr_rsmc_temp_address_pub_key");
        }
        if (this.isNotString(info.curr_htlc_temp_address_pub_key)) {
            return result_1.err("empty curr_htlc_temp_address_pub_key");
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
            return result_1.err("error recipient_node_peer_id");
        }
        if (this.isNotString(recipient_user_peer_id)) {
            return result_1.err("error recipient_user_peer_id");
        }
        if (this.isNotString(info.channel_id)) {
            return result_1.err("empty channel_id");
        }
        if (this.isNotString(info.r)) {
            return result_1.err("empty r");
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
            return result_1.err("error recipient_node_peer_id");
        }
        if (this.isNotString(recipient_user_peer_id)) {
            return result_1.err("error recipient_user_peer_id");
        }
        if (this.isNotString(info.channel_id)) {
            return result_1.err("empty channel_id");
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
            return result_1.err("error recipient_node_peer_id");
        }
        if (this.isNotString(recipient_user_peer_id)) {
            return result_1.err("error recipient_user_peer_id");
        }
        if (this.isNotString(info.channel_id)) {
            return result_1.err("empty channel_id");
        }
        if (this.isNotString(info.last_rsmc_temp_address_private_key)) {
            return result_1.err("empty last_rsmc_temp_address_private_key");
        }
        if (this.isNotString(info.last_htlc_temp_address_private_key)) {
            return result_1.err("empty last_htlc_temp_address_private_key");
        }
        if (this.isNotString(info.last_htlc_temp_address_for_htnx_private_key)) {
            return result_1.err("empty last_htlc_temp_address_private_key");
        }
        if (this.isNotString(info.curr_temp_address_pub_key)) {
            return result_1.err("empty curr_rsmc_temp_address_pub_key");
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
            return result_1.err("error recipient_node_peer_id");
        }
        if (this.isNotString(recipient_user_peer_id)) {
            return result_1.err("error recipient_user_peer_id");
        }
        if (this.isNotString(info.msg_hash)) {
            return result_1.err("empty msg_hash");
        }
        if (this.isNotString(info.last_rsmc_temp_address_private_key)) {
            return result_1.err("empty last_rsmc_temp_address_private_key");
        }
        if (this.isNotString(info.last_htlc_temp_address_private_key)) {
            return result_1.err("empty last_htlc_temp_address_private_key");
        }
        if (this.isNotString(info.last_htlc_temp_address_for_htnx_private_key)) {
            return result_1.err("empty last_htlc_temp_address_for_htnx_private_key");
        }
        if (this.isNotString(info.curr_temp_address_pub_key)) {
            return result_1.err("empty curr_rsmc_temp_address_pub_key");
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
            return result_1.err("empty txid");
        }
        let msg = new pojo_1.Message();
        msg.type = this.messageType.MsgType_Core_Omni_GetTransaction_2118;
        msg.data["txid"] = txid;
        return new Promise(async (resolve) => this.sendData(msg, resolve));
    }
    onGetTransaction(jsonData) { }
    async issueFixedAmount(info) {
        if (this.isNotString(info.from_address)) {
            return result_1.err("empty from_address");
        }
        if (this.isNotString(info.name)) {
            return result_1.err("empty name");
        }
        if (info.ecosystem == null) {
            return result_1.err("empty ecosystem");
        }
        if (info.divisible_type == null) {
            return result_1.err("empty divisible_type");
        }
        if (info.amount == null || info.amount <= 1) {
            return result_1.err("wrong amount");
        }
        if (this.isNotString(info.data)) {
            info.data = "";
        }
        let msg = new pojo_1.Message();
        msg.type = this.messageType.MsgType_Core_Omni_CreateNewTokenFixed_2113;
        msg.data = info;
        return new Promise(async (resolve) => this.sendData(msg, resolve));
    }
    onIssueFixedAmount(jsonData) { }
    async issueManagedAmout(info) {
        if (this.isNotString(info.from_address)) {
            return result_1.err("empty from_address");
        }
        if (this.isNotString(info.name)) {
            return result_1.err("empty name");
        }
        if (info.ecosystem == null) {
            return result_1.err("empty ecosystem");
        }
        if (info.divisible_type == null) {
            return result_1.err("empty divisible_type");
        }
        if (this.isNotString(info.data)) {
            info.data = "";
        }
        let msg = new pojo_1.Message();
        msg.type = this.messageType.MsgType_Core_Omni_CreateNewTokenManaged_2114;
        msg.data = info;
        return new Promise(async (resolve) => this.sendData(msg, resolve));
    }
    onIssueManagedAmout(jsonData) { }
    async sendGrant(info) {
        if (this.isNotString(info.from_address)) {
            return result_1.err("empty from_address");
        }
        if (info.property_id == null || info.property_id < 1) {
            return result_1.err("empty property_id");
        }
        if (info.amount == null || info.amount <= 0) {
            return result_1.err("wrong amount");
        }
        if (this.isNotString(info.memo)) {
            info.memo = "";
        }
        let msg = new pojo_1.Message();
        msg.type = this.messageType.MsgType_Core_Omni_GrantNewUnitsOfManagedToken_2115;
        msg.data = info;
        return new Promise(async (resolve) => this.sendData(msg, resolve));
    }
    onSendGrant(jsonData) { }
    async sendRevoke(info) {
        if (this.isNotString(info.from_address)) {
            return result_1.err("empty from_address");
        }
        if (info.property_id == null || info.property_id < 1) {
            return result_1.err("empty property_id");
        }
        if (info.amount == null || info.amount <= 0) {
            return result_1.err("wrong amount");
        }
        if (this.isNotString(info.memo)) {
            info.memo = "";
        }
        let msg = new pojo_1.Message();
        msg.type = this.messageType.MsgType_Core_Omni_RevokeUnitsOfManagedToken_2116;
        msg.data = info;
        return new Promise(async (resolve) => this.sendData(msg, resolve));
    }
    onSendRevoke(jsonData) { }
    async getAllBalancesForAddress(address) {
        if (this.isNotString(address)) {
            return result_1.err("empty address");
        }
        let msg = new pojo_1.Message();
        msg.type = this.messageType.MsgType_Core_Omni_Getbalance_2112;
        msg.data["address"] = address;
        return new Promise(async (resolve) => this.sendData(msg, resolve));
    }
    onGetAllBalancesForAddress(jsonData) { }
    async getProperty(propertyId) {
        if (this.isNotString(propertyId)) {
            return result_1.err("empty propertyId");
        }
        let msg = new pojo_1.Message();
        msg.type = this.messageType.MsgType_Core_Omni_GetProperty_2119;
        msg.data["propertyId"] = propertyId;
        return new Promise(async (resolve) => this.sendData(msg, resolve));
    }
    onGetProperty(jsonData) { }
    async getBtcBalanceByAddress(address) {
        if (this.isNotString(address)) {
            return result_1.err("empty address");
        }
        let msg = new pojo_1.Message();
        msg.type = this.messageType.MsgType_Core_BalanceByAddress_2108;
        msg.data["address"] = address;
        return new Promise(async (resolve) => this.sendData(msg, resolve));
    }
    onGetBtcBalanceByAddress(jsonData) { }
    async importPrivKey(privkey) {
        if (this.isNotString(privkey)) {
            return result_1.err("empty privkey");
        }
        let msg = new pojo_1.Message();
        msg.type = this.messageType.MsgType_Core_Btc_ImportPrivKey_2111;
        msg.data["privkey"] = privkey;
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
            return result_1.err("empty channel_id");
        }
        let msg = new pojo_1.Message();
        msg.data["channel_id"] = channel_id;
        return new Promise(async (resolve) => this.sendData(msg, resolve));
    }
    onGetRFromCommitmentTx(jsonData) { }
    async getPathInfoByH(h) {
        if (this.isNotString(h)) {
            return result_1.err("empty h");
        }
        let msg = new pojo_1.Message();
        msg.data = h;
        return new Promise(async (resolve) => this.sendData(msg, resolve));
    }
    onGetPathInfoByH(jsonData) { }
    async getRByHOfReceiver(h) {
        if (this.isNotString(h)) {
            return result_1.err("empty h");
        }
        let msg = new pojo_1.Message();
        msg.data = h;
        return new Promise(async (resolve) => this.sendData(msg, resolve));
    }
    onGetRByHOfReceiver(jsonData) { }
    async getLatestCommitmentTransaction(channel_id) {
        if (this.isNotString(channel_id)) {
            return result_1.err("empty channel_id");
        }
        let msg = new pojo_1.Message();
        msg.type = this.messageType.MsgType_CommitmentTx_LatestCommitmentTxByChanId_3203;
        msg.data["channel_id"] = channel_id;
        return new Promise(async (resolve) => this.sendData(msg, resolve));
    }
    onGetLatestCommitmentTransaction(jsonData) { }
    async getItemsByChannelId(channel_id) {
        if (this.isNotString(channel_id)) {
            return result_1.err("empty channel_id");
        }
        let msg = new pojo_1.Message();
        msg.type = this.messageType.MsgType_CommitmentTx_ItemsByChanId_3200;
        msg.data["channel_id"] = channel_id;
        return new Promise(async (resolve) => this.sendData(msg, resolve));
    }
    onGetItemsByChannelId(jsonData) { }
    async getMyChannels(page_size, page_index) {
        if (page_size == null || page_size <= 0) {
            page_size = 10;
        }
        if (page_index == null || page_index <= 0) {
            page_index = 1;
        }
        let msg = new pojo_1.Message();
        msg.type = this.messageType.MsgType_ChannelOpen_AllItem_3150;
        msg.data["page_size"] = page_size;
        msg.data["page_index"] = page_index;
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
            return result_1.err("empty channel_id");
        }
        let msg = new pojo_1.Message();
        msg.type = this.messageType.MsgType_GetChannelInfoByChannelId_3154;
        msg.data = channel_id;
        return new Promise(async (resolve) => this.sendData(msg, resolve));
    }
    onGetChannelDetailFromChannelID(jsonData) { }
    async getChannelDetailFromDatabaseID(id) {
        if (id == null || id <= 0) {
            return result_1.err("error id");
        }
        let msg = new pojo_1.Message();
        msg.type = this.messageType.MsgType_GetChannelInfoByDbId_3155;
        msg.data = id;
        return new Promise(async (resolve) => this.sendData(msg, resolve));
    }
    onGetChannelDetailFromDatabaseID(jsonData) { }
    async getAllBreachRemedyTransactions(channel_id) {
        if (this.isNotString(channel_id)) {
            return result_1.err("empty channel_id");
        }
        let msg = new pojo_1.Message();
        msg.type = this.messageType.MsgType_CommitmentTx_AllBRByChanId_3208;
        msg.data["channel_id"] = channel_id;
        return new Promise(async (resolve) => this.sendData(msg, resolve));
    }
    onGetAllBreachRemedyTransactions(jsonData) { }
    async getAllCommitmentTx(channel_id) {
        if (this.isNotString(channel_id)) {
            return result_1.err("empty channel_id");
        }
        let msg = new pojo_1.Message();
        msg.type = this.messageType.MsgType_CommitmentTx_ItemsByChanId_3200;
        msg.data["channel_id"] = channel_id;
        return new Promise(async (resolve) => this.sendData(msg, resolve));
    }
    onGetAllCommitmentTx(jsonData) { }
    async getLatestRevockableDeliveryTransaction(channel_id) {
        if (this.isNotString(channel_id)) {
            return result_1.err("empty channel_id");
        }
        let msg = new pojo_1.Message();
        msg.type = this.messageType.MsgType_CommitmentTx_LatestRDByChanId_3204;
        msg.data["channel_id"] = channel_id;
        return new Promise(async (resolve) => this.sendData(msg, resolve));
    }
    onGetLatestRevockableDeliveryTransaction(jsonData) { }
    async getLatestBreachRemedyTransaction(channel_id) {
        if (this.isNotString(channel_id)) {
            return result_1.err("empty channel_id");
        }
        let msg = new pojo_1.Message();
        msg.type = this.messageType.MsgType_CommitmentTx_LatestBRByChanId_3205;
        msg.data["channel_id"] = channel_id;
        return new Promise(async (resolve) => this.sendData(msg, resolve));
    }
    onGetLatestBreachRemedyTransaction(jsonData) { }
    async sendSomeCommitmentById(id) {
        if (id == null || id < 0) {
            return result_1.err("error id");
        }
        let msg = new pojo_1.Message();
        msg.type = this.messageType.MsgType_CommitmentTx_SendSomeCommitmentById_3206;
        msg.data = id;
        return new Promise(async (resolve) => this.sendData(msg, resolve));
    }
    onSendSomeCommitmentById(jsonData) { }
    async getAllRevockableDeliveryTransactions(channel_id) {
        if (this.isNotString(channel_id)) {
            return result_1.err("empty channel_id");
        }
        let msg = new pojo_1.Message();
        msg.type = this.messageType.MsgType_CommitmentTx_AllRDByChanId_3207;
        msg.data["channel_id"] = channel_id;
        return new Promise(async (resolve) => this.sendData(msg, resolve));
    }
    onGetAllRevockableDeliveryTransactions(jsonData) { }
    async closeChannel(recipient_node_peer_id, recipient_user_peer_id, channel_id) {
        if (this.isNotString(recipient_node_peer_id)) {
            return result_1.err("error recipient_node_peer_id");
        }
        if (this.isNotString(recipient_user_peer_id)) {
            return result_1.err("error recipient_user_peer_id");
        }
        if (this.isNotString(channel_id)) {
            return result_1.err("empty channel_id");
        }
        let msg = new pojo_1.Message();
        msg.type = this.messageType.MsgType_SendCloseChannelRequest_38;
        msg.data["channel_id"] = channel_id;
        msg.recipient_user_peer_id = recipient_user_peer_id;
        msg.recipient_node_peer_id = recipient_node_peer_id;
        return new Promise(async (resolve) => this.sendData(msg, resolve));
    }
    onCloseChannel(jsonData) { }
    async closeChannelSigned(recipient_node_peer_id, recipient_user_peer_id, info) {
        if (this.isNotString(recipient_node_peer_id)) {
            return result_1.err("error recipient_node_peer_id");
        }
        if (this.isNotString(recipient_user_peer_id)) {
            return result_1.err("error recipient_user_peer_id");
        }
        if (this.isNotString(info.channel_id)) {
            return result_1.err("empty channel_id");
        }
        if (info.approval == null) {
            info.approval = false;
        }
        if (info.approval) {
            if (this.isNotString(info.request_close_channel_hash)) {
                return result_1.err("empty request_close_channel_hash");
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
            return result_1.err("error recipient_node_peer_id");
        }
        if (this.isNotString(recipient_user_peer_id)) {
            return result_1.err("error recipient_user_peer_id");
        }
        if (this.isNotString(info.channel_id_from)) {
            return result_1.err("empty channel_id_from");
        }
        if (this.isNotString(info.channel_id_to)) {
            return result_1.err("empty channel_id_to");
        }
        if (this.isNotString(info.recipient_user_peer_id)) {
            return result_1.err("empty recipient_user_peer_id");
        }
        if (this.isNotString(info.transaction_id)) {
            return result_1.err("empty transaction_id");
        }
        if (info.property_sent <= 0) {
            return result_1.err("wrong property_sent");
        }
        if (info.amount <= 0) {
            return result_1.err("wrong amount");
        }
        if (info.exchange_rate <= 0) {
            return result_1.err("wrong exchange_rate");
        }
        if (info.property_received <= 0) {
            return result_1.err("wrong property_received");
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
            return result_1.err("error recipient_node_peer_id");
        }
        if (this.isNotString(recipient_user_peer_id)) {
            return result_1.err("error recipient_user_peer_id");
        }
        if (this.isNotString(info.channel_id_from)) {
            return result_1.err("empty channel_id_from");
        }
        if (this.isNotString(info.channel_id_to)) {
            return result_1.err("empty channel_id_to");
        }
        if (this.isNotString(info.recipient_user_peer_id)) {
            return result_1.err("empty recipient_user_peer_id");
        }
        if (this.isNotString(info.transaction_id)) {
            return result_1.err("empty transaction_id");
        }
        if (this.isNotString(info.target_transaction_id)) {
            return result_1.err("empty target_transaction_id");
        }
        if (info.property_sent <= 0) {
            return result_1.err("wrong property_sent");
        }
        if (info.amount <= 0) {
            return result_1.err("wrong amount");
        }
        if (info.exchange_rate <= 0) {
            return result_1.err("wrong exchange_rate");
        }
        if (info.property_received <= 0) {
            return result_1.err("wrong property_received");
        }
        let msg = new pojo_1.Message();
        msg.type = this.messageType.MsgType_Atomic_SendSwapAccept_81;
        msg.data = info;
        msg.recipient_user_peer_id = recipient_user_peer_id;
        msg.recipient_node_peer_id = recipient_node_peer_id;
        return new Promise(async (resolve) => this.sendData(msg, resolve));
    }
    isNotString(str) {
        if (str == null) {
            return true;
        }
        return str.trim().length == 0;
    }
}
exports.default = ObdApi;
