import {
  MessageType,
  Message,
  P2PPeer,
  BtcFundingInfo,
  FundingBtcCreated,
  FundingBtcSigned,
  OmniFundingAssetInfo,
  OmniSendAssetInfo,
  OpenChannelInfo,
  AcceptChannelInfo,
  AssetFundingCreatedInfo,
  AssetFundingSignedInfo,
  SignedInfo100100,
  SignedInfo100101,
  SignedInfo100102,
  SignedInfo100103,
  SignedInfo100104,
  SignedInfo100105,
  SignedInfo100106,
  SignedInfo100110,
  SignedInfo100111,
  SignedInfo100112,
  SignedInfo100113,
  SignedInfo100114,
  SignedInfo100360,
  SignedInfo100361,
  SignedInfo100362,
  SignedInfo100363,
  SignedInfo100364,
  SignedInfo101035,
  SignedInfo101134,
  CommitmentTx,
  CommitmentTxSigned,
  InvoiceInfo,
  HTLCFindPathInfo,
  addHTLCInfo,
  HtlcSignedInfo,
  ForwardRInfo,
  SignRInfo,
  CloseHtlcTxInfo,
  CloseHtlcTxInfoSigned,
  IssueFixedAmountInfo,
  IssueManagedAmoutInfo,
  OmniSendGrant,
  OmniSendRevoke,
  CloseChannelSign,
  AtomicSwapAccepted,
  AtomicSwapRequest
} from "./pojo";
import { err, ok, Result } from "./result";
import { IAcceptChannel, IConnect, IOnChannelOpenAttempt } from "./types";

const DEFAULT_URL = "62.234.216.108:60020";

export default class ObdApi {
  constructor({ url = DEFAULT_URL } = {}) {
    this.defaultUrl = url;
  }

  isConnectedToOBD: boolean = false;
  isLoggedIn: boolean = false;
  messageType: MessageType = new MessageType();
  ws: WebSocket | any;
  defaultUrl: string;
  globalCallback: Function | undefined;
  callbackMap: Map<number, Function> = new Map<number, Function>();
  onMessage: Function | undefined;
  onChannelOpenAttempt: ((data: IOnChannelOpenAttempt) => any) | undefined;
  onBitcoinFundingCreated: Function | undefined;
  onChannelClose: Function | undefined;
  onAssetFundingCreated: Function | undefined;

  loginData = {
    nodeAddress: "",
    nodePeerId: "",
    userPeerId: ""
  };

  connect({
    url = this.defaultUrl,
    onOpen = (): any => null,
    onMessage = undefined,
    onChannelOpenAttempt = undefined,
    onBitcoinFundingCreated = undefined,
    onAssetFundingCreated = undefined,
    onChannelClose = undefined,
    onError = (e: string | object): any => null,
    onClose = (code: number, reason: string): any => null,
    onAddHTLC = () => null,
    onForwardR = () => null,
    onSignR = () => null,
    onCloseHTLC = () => null
  } = {}): Promise<Result<IConnect>> {
    return new Promise((resolve) => {
      if (this.isConnectedToOBD || url !== this.defaultUrl) {
        //Disconnect from the current node and connect to the new one
        //this.logout();
        if (this.ws) this.disconnect();
      }

      if (url !== null && url.length > 0) this.defaultUrl = url;
      this.ws = new WebSocket(`ws://${this.defaultUrl}/wstest`);
      if (onMessage !== undefined) this.onMessage = onMessage;
      if (onChannelOpenAttempt !== undefined)
        this.onChannelOpenAttempt = onChannelOpenAttempt;
      if (onBitcoinFundingCreated !== undefined)
        this.onBitcoinFundingCreated = onBitcoinFundingCreated;
      if (onAssetFundingCreated !== undefined)
        this.onAssetFundingCreated = onAssetFundingCreated;
      if (onChannelClose !== undefined) this.onChannelClose = onChannelClose;
      if (onAddHTLC !== undefined) this.onAddHTLC = onAddHTLC;
      if (onForwardR !== undefined) this.onForwardR = onForwardR;
      if (onSignR !== undefined) this.onSignR = onSignR;
      if (onCloseHTLC !== undefined) this.onCloseHTLC = onCloseHTLC;

      this.ws.onopen = () => {
        // connection opened
        if (this.onMessage) this.onMessage(`Connected to ${url}`);
        this.isConnectedToOBD = true;
        onOpen();
      };

      this.ws.onmessage = (e) => {
        // a message was received
        try {
          const jsonData = JSON.parse(e.data);
          //console.log(jsonData);
          this.getDataFromServer(jsonData);
          if (this.onMessage) this.onMessage(jsonData);
          /*
          Someone is attempting to open a channel with you
          */
          if (jsonData.type == -110032) {
            if (this.onChannelOpenAttempt) this.onChannelOpenAttempt(jsonData);
            /*const { funder_node_address, funder_peer_id, funding_pubkey, is_private, funder_address_index } = jsonData.result;
            this.openChannel(funder_node_address, funder_peer_id, { funding_pubkey, is_private, funder_address_index }, () => null);*/
          }

          /*
           *A peer is funding a channel with Bitcoin
           * */
          if (jsonData.type == -110340) {
            //Acknowledge the funding attempt with bitcoinFundingSigned
            if (this.onBitcoinFundingCreated)
              this.onBitcoinFundingCreated(jsonData);
            //this.bitcoinFundingSigned(recipient_node_peer_id, jsonData.result.to_peer_id, { ...jsonData }, () => null);
          }

          //-110034
          if (jsonData.type == -110034) {
            //Acknowledge the asset funding attempt with assetFundingSigned
            if (this.onAssetFundingCreated)
              this.onAssetFundingCreated(jsonData);
            //this.assFundingSigned(recipient_node_peer_id, jsonData.result.to_peer_id, { ...jsonData }, () => null);
          }

          /*
           *A peer is attempting to close a channel.
           * */
          if (jsonData.type == -110038) {
            if (this.onChannelClose) this.onChannelClose(jsonData);
          }

          /*
				   MsgType_HTLC_SendAddHTLC_40
				   MsgType_HTLC_RecvAddHTLC_40
				   */
          if (jsonData.type == -110040) {
            this.onAddHTLC(jsonData);
          }

          /*
				   MsgType_HTLC_SendAddHTLCSigned_41
				   MsgType_HTLC_RecvAddHTLCSigned_41
				   */
          if (jsonData.type == -100041) {
            //Sent Add HTLC
          }
          console.log(e);
          resolve(ok(jsonData));
        } catch (e) {
          console.log(e);
          if (this.onMessage) this.onMessage(e);
          resolve(err(e));
        }
      };

      this.ws.onerror = (e) => {
        // an error occurred
        console.log("Error!");
        console.log(e);
        this.disconnect();
        onError(e.message);
        resolve(err(e.message));
      };

      this.ws.onclose = (e) => {
        // connection closed
        console.log("Closing Up!");
        this.disconnect();
        onClose(e.code, e.reason);
      };
    });
  }

  /**
   * register event
   * @param msgType
   * @param callback
   */
  registerEvent(msgType: number, callback: Function) {
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

  /**
   * remove event
   * @param msgType
   */
  removeEvent(msgType: number) {
    this.callbackMap.delete(msgType);
    //console.info("----------> removeEvent");
  }

  /**
   * Send custom request
   * @param msg
   * @param type
   * @param callback
   */
  sendJsonData(msg: string, type: number, callback: Function) {
    if (!this.isConnectedToOBD) {
      console.log("please try to connect obd again");
      return;
    }

    if (this.isNotString(msg)) {
      console.log("error request content.");
      return;
    }

    //console.info(new Date(), "------send json msg------");
    //console.info(msg);

    if (callback !== null) {
      this.callbackMap[type] = callback;
    }

    this.ws.send(msg);
  }

  /**
   * connectToServer
   * @param url string
   * @param callback function
   * @param globalCallback function
   */
  connectToServer(url: string, callback: Function, globalCallback: Function) {
    if (this.isConnectedToOBD) {
      console.info("already connected");
      if (callback) callback("already connected");
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
        return err("ws close");
      };

      this.ws.onerror = (e) => {
        console.info("ws error", e);
        return err("ws error");
      };
    } catch (e) {
      console.info(e);
      return err(e);
    }
  }

  sendData(msg: Message, callback: Function) {
    if (!this.isConnectedToOBD) {
      console.log("please try to connect obd again");
      return;
    }

    if (
      ((msg.type <= -100000 && msg.type >= -102000) ||
        (msg.type <= -103000 && msg.type >= -104000)) &&
      this.isLoggedIn == false
    ) {
      return err("please login");
    }

    console.info(
      new Date(),
      "----------------------------send msg------------------------------"
    );
    console.info(msg);
    if (callback !== null) {
      this.callbackMap[msg.type] = callback;
    }
    this.ws.send(JSON.stringify(msg));
  }

  getDataFromServer(jsonData: any) {
    console.info(jsonData);

    if (this.globalCallback) this.globalCallback(jsonData);

    let callback = this.callbackMap[jsonData.type];
    if (jsonData.type == 0) return;

    if (jsonData.status == false) {
      //omni error ,do not alert
      if (jsonData.type == this.messageType.MsgType_Core_Omni_Getbalance_2112) {
        try {
          if (callback != null) return callback(err("Omni Error"));
        } catch {
          return err(jsonData);
        }
      }

      if (jsonData.type !== this.messageType.MsgType_Error_0) {
        console.log(jsonData.result);
      }

      try {
        if (callback != null) return callback(err(jsonData));
      } catch {
        return err(jsonData);
      }
      return err(jsonData);
    }

    let resultData = jsonData.result;
    if (jsonData.type == this.messageType.MsgType_Error_0) {
      let tempData: any = {};
      tempData.type = jsonData.type;
      tempData.result = jsonData.data;
      tempData.sender_peer_id = jsonData.sender_peer_id;
      tempData.recipient_user_peer_id = jsonData.recipient_user_peer_id;
      jsonData = tempData;
    }

    let fromId: string = jsonData.from;
    let toId = jsonData.to;
    fromId = fromId.split("@")[0];
    toId = toId.split("@")[0];

    // This message is Alice send to Bob
    if (fromId !== toId) {
      if (callback !== null) {
        resultData["to_peer_id"] = toId;
        try {
          return callback(ok(resultData));
        } catch {
          return err(jsonData);
        }
      }
      return;
    }

    // This message is send to myself
    if (callback != null) callback(ok(resultData));

    if (this.loginData.userPeerId === fromId) return;

    switch (jsonData.type) {
      case this.messageType.MsgType_UserLogin_2001:
        this.userPeerId = toId;
        this.onLogIn(resultData);
        break;
      case this.messageType.MsgType_UserLogout_2002:
        this.onLogout(resultData);
        break;
      // case this.messageType.MsgType_Core_GetNewAddress_2101:
      //   this.onGetNewAddressFromOmniCore(resultData);
      //   break;
      case this.messageType.MsgType_Core_FundingBTC_2109:
        this.onFundingBitcoin(resultData);
        break;
      case this.messageType.MsgType_Core_Omni_ListProperties_2117:
        this.onListProperties(resultData);
        break;
      case this.messageType.MsgType_Core_Omni_FundingAsset_2120:
        this.onFundingAsset(resultData);
        break;

      case this.messageType.MsgType_Mnemonic_CreateAddress_3000:
        this.onGenAddressFromMnemonic(resultData);
        break;
      case this.messageType.MsgType_Mnemonic_GetAddressByIndex_3001:
        this.onGetAddressInfo(resultData);
        break;
      case this.messageType.MsgType_SendChannelOpen_32:
        this.onOpenChannel(resultData);
        break;
      case this.messageType.MsgType_SendChannelAccept_33:
        this.onAcceptChannel(resultData);
        break;
      case this.messageType.MsgType_FundingCreate_SendAssetFundingCreated_34:
        if (this.onAssetFundingCreated) this.onAssetFundingCreated(resultData);
        break;
      case this.messageType.MsgType_FundingSign_SendAssetFundingSigned_35:
        this.onAssetFundingSigned(resultData);
        break;
      case this.messageType
        .MsgType_CommitmentTx_SendCommitmentTransactionCreated_351:
        this.onCommitmentTransactionCreated(resultData);
        break;
      case this.messageType
        .MsgType_CommitmentTxSigned_SendRevokeAndAcknowledgeCommitmentTransaction_352:
        this.onCommitmentTransactionAccepted(resultData);
        break;
      case this.messageType.MsgType_HTLC_Invoice_402:
        this.onAddInvoice(resultData);
        break;
      case this.messageType.MsgType_HTLC_FindPath_401:
        this.onHTLCFindPath(resultData);
        break;
      case this.messageType.MsgType_HTLC_SendAddHTLC_40:
        this.onAddHTLC(resultData);
        break;
      case this.messageType.MsgType_HTLC_SendAddHTLCSigned_41:
        this.onHtlcSigned(resultData);
        break;
      case this.messageType.MsgType_HTLC_SendVerifyR_45:
        this.onForwardR(resultData);
        break;
      case this.messageType.MsgType_HTLC_SendSignVerifyR_46:
        this.onSignR(resultData);
        break;
      case this.messageType.MsgType_HTLC_SendRequestCloseCurrTx_49:
        this.onCloseHTLC(resultData);
        break;
      case this.messageType.MsgType_HTLC_SendCloseSigned_50:
        this.onCloseHTLCSigned(resultData);
        break;

      case this.messageType.MsgType_Core_Omni_GetTransaction_2118:
        this.onGetTransaction(resultData);
        break;
      case this.messageType.MsgType_Core_Omni_CreateNewTokenFixed_2113:
        this.onIssueFixedAmount(resultData);
        break;
    }
  }

  /**
   * MsgType_UserLogin_2001
   * @param mnemonic string
   */
  async logIn(mnemonic: string): Promise<Result<string>> {
    if (this.isLoggedIn) {
      return ok("You are already logged in!");
    }

    if (this.isNotString(mnemonic)) {
      return err("empty mnemonic");
    }

    let msg = new Message();
    msg.type = this.messageType.MsgType_UserLogin_2001;
    msg.data["mnemonic"] = mnemonic;
    return new Promise(async (resolve) => this.sendData(msg, resolve));
  }

  userPeerId: string = "";

  onLogIn(resultData: any) {
    if (!this.isLoggedIn) this.isLoggedIn = true;
  }

  disconnect() {
    this.ws.close();
  }

  /**
   * MsgType_UserLogout_2002
   */
  async logout() {
    if (this.isLoggedIn) {
      let msg = new Message();
      msg.type = this.messageType.MsgType_UserLogout_2002;
      return new Promise(async (resolve) => this.sendData(msg, resolve));
    } else {
      return ok("You have logged out.");
    }
  }

  onLogout(jsonData: any) {
    this.isLoggedIn = false;
  }

  /**
   * MsgType_p2p_ConnectPeer_2003
   * @param info P2PPeer
   */
  async connectPeer(info: P2PPeer) {
    if (this.isNotString(info.remote_node_address)) {
      return err("Empty remote_node_address");
    }
    let msg = new Message();
    msg.data = info;
    msg.type = this.messageType.MsgType_p2p_ConnectPeer_2003;
    return new Promise(async (resolve) => this.sendData(msg, resolve));
  }

  /**
   * MsgType_Core_GetNewAddress_2101
   * @param callback function
   */
  //  getNewAddress(callback: Function) {
  //   let msg = new Message();
  //   msg.type = this.messageType.MsgType_Core_GetNewAddress_2101;
  //   this.sendData(msg, callback);
  // }
  //  onGetNewAddressFromOmniCore(jsonData: any) {}

  /**
   * MsgType_Core_FundingBTC_2109
   * @param info BtcFundingInfo
   */
  async fundingBitcoin(info: BtcFundingInfo) {
    if (this.isNotString(info.from_address)) {
      return err("empty from_address");
    }
    if (this.isNotString(info.to_address)) {
      return err("empty to_address");
    }
    if (info.amount == null || info.amount <= 0) {
      return err("wrong amount");
    }
    if (info.miner_fee == null || info.miner_fee <= 0) {
      info.miner_fee = 0;
    }

    let msg = new Message();
    msg.type = this.messageType.MsgType_Core_FundingBTC_2109;
    msg.data = info;
    return new Promise(async (resolve) => this.sendData(msg, resolve));
  }

  onFundingBitcoin(jsonData: any) {}

  /**
   * MsgType_FundingCreate_SendBtcFundingCreated_340
   * @param recipient_node_peer_id string
   * @param recipient_user_peer_id string
   * @param info  FundingBtcCreated
   */
  async bitcoinFundingCreated(
    recipient_node_peer_id: string,
    recipient_user_peer_id: string,
    info: FundingBtcCreated
  ) {
    if (this.isNotString(recipient_node_peer_id)) {
      return err("error recipient_node_peer_id");
    }

    if (this.isNotString(recipient_user_peer_id)) {
      return err("error recipient_user_peer_id");
    }

    if (this.isNotString(info.temporary_channel_id)) {
      return err("empty temporary_channel_id");
    }
    if (this.isNotString(info.funding_tx_hex)) {
      return err("empty funding_tx_hex");
    }

    let msg = new Message();
    msg.type = this.messageType.MsgType_FundingCreate_SendBtcFundingCreated_340;
    msg.recipient_user_peer_id = recipient_user_peer_id;
    msg.recipient_node_peer_id = recipient_node_peer_id;
    msg.data = info;
    return new Promise(async (resolve) => this.sendData(msg, resolve));
  }

  /**
   * MsgType_FundingCreate_BtcFundingMinerRDTxToClient_341
   * @param recipient_node_peer_id string
   * @param recipient_user_peer_id string
   * @param signed_hex  string
   */
  async sendSignedHex100341(
    recipient_node_peer_id: string,
    recipient_user_peer_id: string,
    signed_hex: string
  ) {
    if (this.isNotString(recipient_node_peer_id)) {
      return err("error recipient_node_peer_id");
    }

    if (this.isNotString(recipient_user_peer_id)) {
      return err("error recipient_user_peer_id");
    }

    let msg = new Message();
    msg.type = this.messageType.MsgType_FundingCreate_BtcFundingMinerRDTxToClient_341;
    msg.recipient_user_peer_id = recipient_user_peer_id;
    msg.recipient_node_peer_id = recipient_node_peer_id;
    msg.data["hex"] = signed_hex;
    return new Promise(async (resolve) => this.sendData(msg, resolve));
  }

  /**
   * MsgType_FundingSign_SendBtcSign_350
   * @param recipient_node_peer_id string
   * @param recipient_user_peer_id string
   * @param info FundingBtcSigned
   */
  async bitcoinFundingSigned(
    recipient_node_peer_id: string,
    recipient_user_peer_id: string,
    info: FundingBtcSigned
  ) {
    if (this.isNotString(recipient_node_peer_id)) {
      return err("error recipient_node_peer_id");
    }
    if (this.isNotString(recipient_user_peer_id)) {
      return err("error recipient_user_peer_id");
    }
    if (this.isNotString(info.temporary_channel_id)) {
      return err("empty temporary_channel_id");
    }
    if (this.isNotString(info.funding_txid)) {
      return err("empty funding_txid");
    }
    if (this.isNotString(info.signed_miner_redeem_transaction_hex)) {
      return err("empty signed_miner_redeem_transaction_hex");
    }

    let msg = new Message();
    msg.type = this.messageType.MsgType_FundingSign_SendBtcSign_350;
    msg.recipient_user_peer_id = recipient_user_peer_id;
    msg.recipient_node_peer_id = recipient_node_peer_id;
    msg.data = info;
    return new Promise(async (resolve) => this.sendData(msg, resolve));
  }

  /**
   * MsgType_Core_Omni_ListProperties_2117
   */
  async listProperties() {
    let msg = new Message();
    msg.type = this.messageType.MsgType_Core_Omni_ListProperties_2117;
    return new Promise(async (resolve) => this.sendData(msg, resolve));
  }

  onListProperties(jsonData: any) {}

  /**
   * MsgType_Core_Omni_FundingAsset_2120
   * @param info OmniFundingAssetInfo
   */
  async fundingAsset(info: OmniFundingAssetInfo) {
    if (this.isNotString(info.from_address)) {
      return err("empty from_address");
    }
    if (this.isNotString(info.to_address)) {
      return err("empty to_address");
    }
    if (info.property_id == null || info.property_id <= 0) {
      return err("error property_id");
    }

    if (info.amount == null || info.amount <= 0) {
      return err("Incorrect amount");
    }
    if (info.miner_fee == null || info.miner_fee <= 0) {
      info.miner_fee = 0;
    }

    let msg = new Message();
    msg.type = this.messageType.MsgType_Core_Omni_FundingAsset_2120;
    msg.data = info;
    return new Promise(async (resolve) => this.sendData(msg, resolve));
  }

  onFundingAsset(jsonData: any) {}

  /**
   * MsgType_Core_Omni_Send_2121
   * @param info OmniSendAssetInfo
   */
  async sendAsset(info: OmniSendAssetInfo) {
    if (this.isNotString(info.from_address)) {
      return err("empty from_address");
    }
    if (this.isNotString(info.to_address)) {
      return err("empty to_address");
    }
    if (info.property_id == null || info.property_id <= 0) {
      return err("error property_id");
    }

    if (info.amount == null || info.amount <= 0) {
      return err("wrong amount");
    }

    let msg = new Message();
    msg.type = this.messageType.MsgType_Core_Omni_Send_2121;
    msg.data = info;
    return new Promise(async (resolve) => this.sendData(msg, resolve));
  }

  onSendAsset(jsonData: any) {}

  /**
   * MsgType_Mnemonic_CreateAddress_3000
   */
  async genAddressFromMnemonic() {
    let msg = new Message();
    msg.type = this.messageType.MsgType_Mnemonic_CreateAddress_3000;
    return new Promise(async (resolve) => this.sendData(msg, resolve));
  }

  onGenAddressFromMnemonic(jsonData: any) {}

  /**
   * MsgType_Mnemonic_GetAddressByIndex_3001
   * @param index:number
   */
  async getAddressInfo(index: number) {
    if (index == null || index < 0) {
      return err("error index");
    }

    let msg: Message = new Message();
    msg.type = this.messageType.MsgType_Mnemonic_GetAddressByIndex_3001;
    msg.data = index;
    return new Promise(async (resolve) => this.sendData(msg, resolve));
  }

  onGetAddressInfo(jsonData: any) {}

  /**
   * MsgType_SendChannelOpen_32
   * @param recipient_node_peer_id string
   * @param recipient_user_peer_id string
   * @param info OpenChannelInfo
   */
  async openChannel(
    recipient_node_peer_id: string,
    recipient_user_peer_id: string,
    info: OpenChannelInfo
  ): Promise<Result<string>> {
    if (this.isNotString(recipient_node_peer_id)) {
      return err("error recipient_node_peer_id");
    }

    if (this.isNotString(recipient_user_peer_id)) {
      return err("error recipient_user_peer_id");
    }

    if (this.isNotString(info.funding_pubkey)) {
      return err("error funding_pubkey");
    }

    if (info.is_private == null) {
      info.is_private = false;
    }

    let msg = new Message();
    msg.type = this.messageType.MsgType_SendChannelOpen_32;
    msg.recipient_node_peer_id = recipient_node_peer_id;
    msg.recipient_user_peer_id = recipient_user_peer_id;
    msg.data = info;
    return new Promise(async (resolve) => this.sendData(msg, resolve));
  }

  onOpenChannel(jsonData: any) {}

  /**
   * MsgType_SendChannelAccept_33
   * @param recipient_node_peer_id string
   * @param recipient_user_peer_id string
   * @param info AcceptChannelInfo
   */
  async acceptChannel(
    recipient_node_peer_id: string,
    recipient_user_peer_id: string,
    info: AcceptChannelInfo
  ): Promise<Result<IAcceptChannel>> {
    if (this.isNotString(recipient_node_peer_id)) {
      return err("error recipient_node_peer_id");
    }

    if (this.isNotString(recipient_user_peer_id)) {
      return err("error recipient_user_peer_id");
    }

    if (this.isNotString(info.temporary_channel_id)) {
      return err("empty temporary_channel_id");
    }

    if (info.approval == null) {
      info.approval = false;
    }

    if (info.approval) {
      if (this.isNotString(info.funding_pubkey)) {
        return err("empty funding_pubkey");
      }
    }

    let msg = new Message();
    msg.type = this.messageType.MsgType_SendChannelAccept_33;
    msg.recipient_node_peer_id = recipient_node_peer_id;
    msg.recipient_user_peer_id = recipient_user_peer_id;
    msg.data = info;
    return new Promise(async (resolve) => this.sendData(msg, resolve));
  }

  onAcceptChannel(jsonData: any) {}

  /**
   * MsgType_CheckChannelAddessExist_3156
   * Parameters same to type 33
   *
   * @param recipient_node_peer_id string
   * @param recipient_user_peer_id string
   * @param info AcceptChannelInfo
   */
  async checkChannelAddessExist(
    recipient_node_peer_id: string,
    recipient_user_peer_id: string,
    info: AcceptChannelInfo
  ) {
    if (this.isNotString(recipient_node_peer_id)) {
      return err("error recipient_node_peer_id");
    }

    if (this.isNotString(recipient_user_peer_id)) {
      return err("error recipient_user_peer_id");
    }

    if (this.isNotString(info.temporary_channel_id)) {
      return err("empty temporary_channel_id");
    }

    if (info.approval == null) {
      info.approval = false;
    }

    if (info.approval) {
      if (this.isNotString(info.funding_pubkey)) {
        return err("empty funding_pubkey");
      }
    }

    let msg = new Message();
    msg.type = this.messageType.MsgType_CheckChannelAddessExist_3156;
    msg.recipient_node_peer_id = recipient_node_peer_id;
    msg.recipient_user_peer_id = recipient_user_peer_id;
    msg.data = info;
    return new Promise(async (resolve) => this.sendData(msg, resolve));
  }

  onCheckChannelAddessExist(jsonData: any) {}

  /**
   * MsgType_FundingCreate_SendAssetFundingCreated_34
   * @param recipient_node_peer_id string
   * @param recipient_user_peer_id string
   * @param info AssetFundingCreatedInfo
   */
  async assetFundingCreated(
    recipient_node_peer_id: string,
    recipient_user_peer_id: string,
    info: AssetFundingCreatedInfo
  ) {
    if (this.isNotString(recipient_node_peer_id)) {
      return err("error recipient_node_peer_id");
    }

    if (this.isNotString(recipient_user_peer_id)) {
      return err("error recipient_user_peer_id");
    }

    if (this.isNotString(info.temporary_channel_id)) {
      return err("empty temporary_channel_id");
    }
    if (this.isNotString(info.funding_tx_hex)) {
      return err("empty funding_tx_hex");
    }
    if (this.isNotString(info.temp_address_pub_key)) {
      return err("empty temp_address_pub_key");
    }

    let msg = new Message();
    msg.type = this.messageType.MsgType_FundingCreate_SendAssetFundingCreated_34;
    msg.recipient_user_peer_id = recipient_user_peer_id;
    msg.recipient_node_peer_id = recipient_node_peer_id;
    msg.data = info;
    return new Promise(async (resolve) => this.sendData(msg, resolve));
  }

  /**
   * MsgType_ClientSign_AssetFunding_AliceSignC1a_1034
   * @param recipient_node_peer_id string
   * @param recipient_user_peer_id string
   * @param signed_hex  string
   */
  async sendSignedHex101034(
    recipient_node_peer_id: string,
    recipient_user_peer_id: string,
    signed_hex: string
  ) {
    if (this.isNotString(recipient_node_peer_id)) {
      return err("error recipient_node_peer_id");
    }

    if (this.isNotString(recipient_user_peer_id)) {
      return err("error recipient_user_peer_id");
    }

    let msg = new Message();
    msg.type = this.messageType.MsgType_ClientSign_AssetFunding_AliceSignC1a_1034;
    msg.recipient_user_peer_id = recipient_user_peer_id;
    msg.recipient_node_peer_id = recipient_node_peer_id;
    msg.data["signed_c1a_hex"] = signed_hex;
    return new Promise(async (resolve) => this.sendData(msg, resolve));
  }

  /**
   * MsgType_ClientSign_AssetFunding_AliceSignRD_1134
   * @param info      SignedInfo101134
   */
  async sendSignedHex101134(info: SignedInfo101134) {
    if (this.isNotString(info.channel_id)) {
      return err("empty channel_id");
    }

    let msg = new Message();
    msg.type = this.messageType.MsgType_ClientSign_AssetFunding_AliceSignRD_1134;
    msg.data = info;
    return new Promise(async (resolve) => this.sendData(msg, resolve));
  }

  /**
   * MsgType_FundingSign_SendAssetFundingSigned_35
   * @param recipient_node_peer_id string
   * @param recipient_user_peer_id string
   * @param info AssetFundingSignedInfo
   */
  async assetFundingSigned(
    recipient_node_peer_id: string,
    recipient_user_peer_id: string,
    info: AssetFundingSignedInfo
  ) {
    if (this.isNotString(recipient_node_peer_id)) {
      return err("error recipient_node_peer_id");
    }

    if (this.isNotString(recipient_user_peer_id)) {
      return err("error recipient_user_peer_id");
    }

    if (this.isNotString(info.temporary_channel_id)) {
      return err("empty temporary_channel_id");
    }

    if (this.isNotString(info.signed_alice_rsmc_hex)) {
      return err("empty signed_alice_rsmc_hex");
    }

    let msg = new Message();
    msg.type = this.messageType.MsgType_FundingSign_SendAssetFundingSigned_35;
    msg.recipient_user_peer_id = recipient_user_peer_id;
    msg.recipient_node_peer_id = recipient_node_peer_id;
    msg.data = info;
    return new Promise(async (resolve) => this.sendData(msg, resolve));
  }

  onAssetFundingSigned(jsonData: any) {}

  /**
   * MsgType_ClientSign_Duplex_AssetFunding_RdAndBr_1035
   * @param recipient_node_peer_id string
   * @param recipient_user_peer_id string
   * @param info  SignedInfo101035
   */
  async sendSignedHex101035(
    recipient_node_peer_id: string,
    recipient_user_peer_id: string,
    info: SignedInfo101035
  ) {
    if (this.isNotString(recipient_node_peer_id)) {
      return err("error recipient_node_peer_id");
    }

    if (this.isNotString(recipient_user_peer_id)) {
      return err("error recipient_user_peer_id");
    }

    if (this.isNotString(info.temporary_channel_id)) {
      return err("empty temporary_channel_id");
    }

    let msg = new Message();
    msg.type = this.messageType.MsgType_ClientSign_Duplex_AssetFunding_RdAndBr_1035;
    msg.recipient_user_peer_id = recipient_user_peer_id;
    msg.recipient_node_peer_id = recipient_node_peer_id;
    msg.data = info;
    return new Promise(async (resolve) => this.sendData(msg, resolve));
  }

  /**
   * MsgType_CommitmentTx_SendCommitmentTransactionCreated_351
   * @param recipient_node_peer_id string
   * @param recipient_user_peer_id string
   * @param info CommitmentTx
   */
  async commitmentTransactionCreated(
    recipient_node_peer_id: string,
    recipient_user_peer_id: string,
    info: CommitmentTx
  ) {
    if (this.isNotString(recipient_node_peer_id)) {
      return err("error recipient_node_peer_id");
    }

    if (this.isNotString(recipient_user_peer_id)) {
      return err("error recipient_user_peer_id");
    }

    if (this.isNotString(info.channel_id)) {
      return err("empty channel_id");
    }
    if (this.isNotString(info.curr_temp_address_pub_key)) {
      return err("empty curr_temp_address_pub_key");
    }
    if (info.amount == null || info.amount <= 0) {
      return err("wrong amount");
    }

    let msg = new Message();
    msg.type = this.messageType.MsgType_CommitmentTx_SendCommitmentTransactionCreated_351;
    msg.recipient_user_peer_id = recipient_user_peer_id;
    msg.recipient_node_peer_id = recipient_node_peer_id;
    msg.data = info;
    return new Promise(async (resolve) => this.sendData(msg, resolve));
  }

  onCommitmentTransactionCreated(jsonData: any) {}

  /**
   * MsgType_ClientSign_CommitmentTx_AliceSignC2a_360
   * @param recipient_node_peer_id string
   * @param recipient_user_peer_id string
   * @param info      SignedInfo100360
   */
  async sendSignedHex100360(
    recipient_node_peer_id: string,
    recipient_user_peer_id: string,
    info: SignedInfo100360
  ) {
    if (this.isNotString(recipient_node_peer_id)) {
      return err("error recipient_node_peer_id");
    }

    if (this.isNotString(recipient_user_peer_id)) {
      return err("error recipient_user_peer_id");
    }

    if (this.isNotString(info.channel_id)) {
      return err("empty channel_id");
    }

    let msg = new Message();
    msg.type = this.messageType.MsgType_ClientSign_CommitmentTx_AliceSignC2a_360;
    msg.recipient_user_peer_id = recipient_user_peer_id;
    msg.recipient_node_peer_id = recipient_node_peer_id;
    msg.data = info;
    return new Promise(async (resolve) => this.sendData(msg, resolve));
  }

  /**
   * MsgType_CommitmentTxSigned_SendRevokeAndAcknowledgeCommitmentTransaction_352
   * @param recipient_node_peer_id string
   * @param recipient_user_peer_id string
   * @param info CommitmentTxSigned
   */
  async commitmentTransactionAccepted(
    recipient_node_peer_id: string,
    recipient_user_peer_id: string,
    info: CommitmentTxSigned
  ) {
    if (this.isNotString(recipient_node_peer_id)) {
      return err("error recipient_node_peer_id");
    }

    if (this.isNotString(recipient_user_peer_id)) {
      return err("error recipient_user_peer_id");
    }

    if (this.isNotString(info.channel_id)) {
      return err("empty channel_id");
    }

    if (this.isNotString(info.msg_hash)) {
      return err("empty msg_hash");
    }

    if (info.approval == null) {
      info.approval = false;
    }
    if (info.approval == true) {
      if (this.isNotString(info.curr_temp_address_pub_key)) {
        return err("empty curr_temp_address_pub_key");
      }
    }

    let msg = new Message();
    msg.type = this.messageType.MsgType_CommitmentTxSigned_SendRevokeAndAcknowledgeCommitmentTransaction_352;
    msg.recipient_user_peer_id = recipient_user_peer_id;
    msg.recipient_node_peer_id = recipient_node_peer_id;
    msg.data = info;
    return new Promise(async (resolve) => this.sendData(msg, resolve));
  }

  onCommitmentTransactionAccepted(jsonData: any) {}

  /**
   * MsgType_ClientSign_CommitmentTx_BobSignC2b_361
   * @param recipient_node_peer_id string
   * @param recipient_user_peer_id string
   * @param info      SignedInfo100361
   */
  async sendSignedHex100361(
    recipient_node_peer_id: string,
    recipient_user_peer_id: string,
    info: SignedInfo100361
  ) {
    if (this.isNotString(recipient_node_peer_id)) {
      return err("error recipient_node_peer_id");
    }

    if (this.isNotString(recipient_user_peer_id)) {
      return err("error recipient_user_peer_id");
    }

    if (this.isNotString(info.channel_id)) {
      return err("empty channel_id");
    }

    let msg = new Message();
    msg.type = this.messageType.MsgType_ClientSign_CommitmentTx_BobSignC2b_361;
    msg.recipient_user_peer_id = recipient_user_peer_id;
    msg.recipient_node_peer_id = recipient_node_peer_id;
    msg.data = info;
    return new Promise(async (resolve) => this.sendData(msg, resolve));
  }

  /**
   * MsgType_ClientSign_CommitmentTx_AliceSignC2b_362
   * @param recipient_node_peer_id string
   * @param recipient_user_peer_id string
   * @param info      SignedInfo100362
   */
  async sendSignedHex100362(
    recipient_node_peer_id: string,
    recipient_user_peer_id: string,
    info: SignedInfo100362
  ) {
    if (this.isNotString(recipient_node_peer_id)) {
      return err("error recipient_node_peer_id");
    }

    if (this.isNotString(recipient_user_peer_id)) {
      return err("error recipient_user_peer_id");
    }

    if (this.isNotString(info.channel_id)) {
      return err("empty channel_id");
    }

    let msg = new Message();
    msg.type = this.messageType.MsgType_ClientSign_CommitmentTx_AliceSignC2b_362;
    msg.recipient_user_peer_id = recipient_user_peer_id;
    msg.recipient_node_peer_id = recipient_node_peer_id;
    msg.data = info;
    return new Promise(async (resolve) => this.sendData(msg, resolve));
  }

  /**
   * MsgType_ClientSign_CommitmentTx_AliceSignC2b_Rd_363
   * @param recipient_node_peer_id string
   * @param recipient_user_peer_id string
   * @param info      SignedInfo100363
   */
  async sendSignedHex100363(
    recipient_node_peer_id: string,
    recipient_user_peer_id: string,
    info: SignedInfo100363
  ) {
    if (this.isNotString(recipient_node_peer_id)) {
      return err("error recipient_node_peer_id");
    }

    if (this.isNotString(recipient_user_peer_id)) {
      return err("error recipient_user_peer_id");
    }

    if (this.isNotString(info.channel_id)) {
      return err("empty channel_id");
    }

    let msg = new Message();
    msg.type = this.messageType.MsgType_ClientSign_CommitmentTx_AliceSignC2b_Rd_363;
    msg.recipient_user_peer_id = recipient_user_peer_id;
    msg.recipient_node_peer_id = recipient_node_peer_id;
    msg.data = info;
    return new Promise(async (resolve) => this.sendData(msg, resolve));
  }

  /**
   * MsgType_ClientSign_CommitmentTx_BobSignC2b_Rd_364
   * @param info      SignedInfo100364
   */
  async sendSignedHex100364(info: SignedInfo100364) {
    if (this.isNotString(info.channel_id)) {
      return err("empty channel_id");
    }

    let msg = new Message();
    msg.type = this.messageType.MsgType_ClientSign_CommitmentTx_BobSignC2b_Rd_364;
    msg.data = info;
    return new Promise(async (resolve) => this.sendData(msg, resolve));
  }

  /**
   * MsgType_HTLC_Invoice_402
   * @param info InvoiceInfo
   */
  async addInvoice(info: InvoiceInfo) {
    if (info.property_id == null || info.property_id <= 0) {
      return err("empty property_id");
    }

    if (info.amount == null || info.amount <= 0) {
      return err("wrong amount");
    }

    if (this.isNotString(info.h)) {
      return err("empty h");
    }

    if (this.isNotString(info.expiry_time)) {
      return err("empty expiry_time");
    }

    let msg = new Message();
    msg.type = this.messageType.MsgType_HTLC_Invoice_402;
    msg.data = info;
    return new Promise(async (resolve) => this.sendData(msg, resolve));
  }

  onAddInvoice(jsonData: any) {}

  /**
   * MsgType_HTLC_FindPath_401
   * @param info HTLCFindPathInfo
   */
  async HTLCFindPath(info: HTLCFindPathInfo) {
    if (!info?.is_inv_pay) {
      if (info.property_id == null || info.property_id <= 0) {
        return err("empty property_id");
      }
      if (info.amount == null || info.amount < 0.001) {
        return err("wrong amount");
      }
      if (this.isNotString(info.h)) {
        return err("empty h");
      }
      if (this.isNotString(info.expiry_time)) {
        return err("empty expiry_time");
      }
    } else if (this.isNotString(info.invoice)) {
      return err("empty invoice");
    }
    let msg = new Message();
    msg.type = this.messageType.MsgType_HTLC_FindPath_401;
    msg.data = info;
    return new Promise(async (resolve) => this.sendData(msg, resolve));
  }

  onHTLCFindPath(jsonData: any) {}

  /**
   * MsgType_HTLC_SendAddHTLC_40
   * @param recipient_node_peer_id string
   * @param recipient_user_peer_id string
   * @param info addHTLCInfo
   */
  async addHTLC(
    recipient_node_peer_id: string,
    recipient_user_peer_id: string,
    info: addHTLCInfo
  ) {
    if (this.isNotString(recipient_node_peer_id)) {
      return err("error recipient_node_peer_id");
    }

    if (this.isNotString(recipient_user_peer_id)) {
      return err("error recipient_user_peer_id");
    }

    if (this.isNotString(info.h)) {
      return err("empty h");
    }
    if (info.property_id <= 0) {
      return err("wrong property_id");
    }
    if (info.amount <= 0) {
      return err("wrong amount");
    }
    if (this.isNotString(info.memo)) {
      info.memo = "";
    }
    if (this.isNotString(info.routing_packet)) {
      return err("empty routing_packet");
    }
    if (info.cltv_expiry <= 0) {
      return err("wrong cltv_expiry");
    }
    if (this.isNotString(info.last_temp_address_private_key)) {
      return err("empty last_temp_address_private_key");
    }
    if (this.isNotString(info.curr_rsmc_temp_address_pub_key)) {
      return err("empty curr_rsmc_temp_address_pub_key");
    }
    if (this.isNotString(info.curr_htlc_temp_address_pub_key)) {
      return err("empty curr_htlc_temp_address_pub_key");
    }
    if (this.isNotString(info.curr_htlc_temp_address_for_ht1a_pub_key)) {
      return err("empty curr_htlc_temp_address_for_ht1a_pub_key");
    }

    let msg = new Message();
    msg.type = this.messageType.MsgType_HTLC_SendAddHTLC_40;
    msg.data = info;
    msg.recipient_user_peer_id = recipient_user_peer_id;
    msg.recipient_node_peer_id = recipient_node_peer_id;
    return new Promise(async (resolve) => this.sendData(msg, resolve));
  }

  onAddHTLC(jsonData: any) {}

  /**
   * MsgType_HTLC_ClientSign_Alice_C3a_100
   * @param recipient_node_peer_id string
   * @param recipient_user_peer_id string
   * @param info  SignedInfo100100
   */
  async sendSignedHex100100(
    recipient_node_peer_id: string,
    recipient_user_peer_id: string,
    info: SignedInfo100100
  ) {
    if (this.isNotString(recipient_node_peer_id)) {
      return err("error recipient_node_peer_id");
    }

    if (this.isNotString(recipient_user_peer_id)) {
      return err("error recipient_user_peer_id");
    }

    if (this.isNotString(info.channel_id)) {
      return err("empty channel_id");
    }

    let msg = new Message();
    msg.type = this.messageType.MsgType_HTLC_ClientSign_Alice_C3a_100;
    msg.recipient_user_peer_id = recipient_user_peer_id;
    msg.recipient_node_peer_id = recipient_node_peer_id;
    msg.data = info;
    return new Promise(async (resolve) => this.sendData(msg, resolve));
  }

  /**
   * MsgType_HTLC_ClientSign_Bob_C3b_101
   * @param recipient_node_peer_id string
   * @param recipient_user_peer_id string
   * @param info  SignedInfo100101
   */
  async sendSignedHex100101(
    recipient_node_peer_id: string,
    recipient_user_peer_id: string,
    info: SignedInfo100101
  ) {
    if (this.isNotString(recipient_node_peer_id)) {
      return err("error recipient_node_peer_id");
    }

    if (this.isNotString(recipient_user_peer_id)) {
      return err("error recipient_user_peer_id");
    }

    if (this.isNotString(info.channel_id)) {
      return err("empty channel_id");
    }

    let msg = new Message();
    msg.type = this.messageType.MsgType_HTLC_ClientSign_Bob_C3b_101;
    msg.recipient_user_peer_id = recipient_user_peer_id;
    msg.recipient_node_peer_id = recipient_node_peer_id;
    msg.data = info;
    return new Promise(async (resolve) => this.sendData(msg, resolve));
  }

  /**
   * MsgType_HTLC_ClientSign_Alice_C3b_102
   * @param info  SignedInfo100102
   */
  async sendSignedHex100102(info: SignedInfo100102) {
    if (this.isNotString(info.channel_id)) {
      return err("empty channel_id");
    }

    let msg = new Message();
    msg.type = this.messageType.MsgType_HTLC_ClientSign_Alice_C3b_102;
    msg.data = info;
    return new Promise(async (resolve) => this.sendData(msg, resolve));
  }

  /**
   * MsgType_HTLC_ClientSign_Alice_C3bSub_103
   * @param recipient_node_peer_id string
   * @param recipient_user_peer_id string
   * @param info  SignedInfo100103
   */
  async sendSignedHex100103(
    recipient_node_peer_id: string,
    recipient_user_peer_id: string,
    info: SignedInfo100103
  ) {
    if (this.isNotString(recipient_node_peer_id)) {
      return err("error recipient_node_peer_id");
    }

    if (this.isNotString(recipient_user_peer_id)) {
      return err("error recipient_user_peer_id");
    }

    if (this.isNotString(info.channel_id)) {
      return err("empty channel_id");
    }

    let msg = new Message();
    msg.type = this.messageType.MsgType_HTLC_ClientSign_Alice_C3bSub_103;
    msg.recipient_user_peer_id = recipient_user_peer_id;
    msg.recipient_node_peer_id = recipient_node_peer_id;
    msg.data = info;
    return new Promise(async (resolve) => this.sendData(msg, resolve));
  }

  /**
   * MsgType_HTLC_ClientSign_Bob_C3bSub_104
   * @param info  SignedInfo100104
   */
  async sendSignedHex100104(info: SignedInfo100104) {
    if (this.isNotString(info.channel_id)) {
      return err("empty channel_id");
    }

    if (this.isNotString(info.curr_htlc_temp_address_for_he_pub_key)) {
      return err("empty curr_htlc_temp_address_for_he_pub_key");
    }

    let msg = new Message();
    msg.type = this.messageType.MsgType_HTLC_ClientSign_Bob_C3bSub_104;
    msg.data = info;
    return new Promise(async (resolve) => this.sendData(msg, resolve));
  }

  /**
   * MsgType_HTLC_ClientSign_Alice_He_105
   * @param recipient_node_peer_id string
   * @param recipient_user_peer_id string
   * @param info  SignedInfo100105
   */
  sendSignedHex100105(
    recipient_node_peer_id: string,
    recipient_user_peer_id: string,
    info: SignedInfo100105
  ) {
    if (this.isNotString(recipient_node_peer_id)) {
      return err("error recipient_node_peer_id");
    }

    if (this.isNotString(recipient_user_peer_id)) {
      return err("error recipient_user_peer_id");
    }

    if (this.isNotString(info.channel_id)) {
      return err("empty channel_id");
    }

    let msg = new Message();
    msg.type = this.messageType.MsgType_HTLC_ClientSign_Alice_He_105;
    msg.recipient_user_peer_id = recipient_user_peer_id;
    msg.recipient_node_peer_id = recipient_node_peer_id;
    msg.data = info;
    return new Promise(async (resolve) => this.sendData(msg, resolve));
  }

  /**
   * MsgType_HTLC_ClientSign_Bob_HeSub_106
   * @param recipient_node_peer_id string
   * @param recipient_user_peer_id string
   * @param info  SignedInfo100106
   */
  sendSignedHex100106(
    recipient_node_peer_id: string,
    recipient_user_peer_id: string,
    info: SignedInfo100106
  ) {
    if (this.isNotString(recipient_node_peer_id)) {
      return err("error recipient_node_peer_id");
    }

    if (this.isNotString(recipient_user_peer_id)) {
      return err("error recipient_user_peer_id");
    }

    if (this.isNotString(info.channel_id)) {
      return err("empty channel_id");
    }

    let msg = new Message();
    msg.type = this.messageType.MsgType_HTLC_ClientSign_Bob_HeSub_106;
    msg.recipient_user_peer_id = recipient_user_peer_id;
    msg.recipient_node_peer_id = recipient_node_peer_id;
    msg.data = info;
    return new Promise(async (resolve) => this.sendData(msg, resolve));
  }

  /**
   * MsgType_HTLC_Close_ClientSign_Alice_C4a_110
   * @param recipient_node_peer_id string
   * @param recipient_user_peer_id string
   * @param info  SignedInfo100110
   */
  sendSignedHex100110(
    recipient_node_peer_id: string,
    recipient_user_peer_id: string,
    info: SignedInfo100110
  ) {
    if (this.isNotString(recipient_node_peer_id)) {
      return err("error recipient_node_peer_id");
    }

    if (this.isNotString(recipient_user_peer_id)) {
      return err("error recipient_user_peer_id");
    }

    if (this.isNotString(info.channel_id)) {
      return err("empty channel_id");
    }

    let msg = new Message();
    msg.type = this.messageType.MsgType_HTLC_Close_ClientSign_Alice_C4a_110;
    msg.recipient_user_peer_id = recipient_user_peer_id;
    msg.recipient_node_peer_id = recipient_node_peer_id;
    msg.data = info;
    return new Promise(async (resolve) => this.sendData(msg, resolve));
  }

  /**
   * MsgType_HTLC_Close_ClientSign_Bob_C4b_111
   * @param recipient_node_peer_id string
   * @param recipient_user_peer_id string
   * @param info  SignedInfo100111
   */
  async sendSignedHex100111(
    recipient_node_peer_id: string,
    recipient_user_peer_id: string,
    info: SignedInfo100111
  ) {
    if (this.isNotString(recipient_node_peer_id)) {
      return err("error recipient_node_peer_id");
    }

    if (this.isNotString(recipient_user_peer_id)) {
      return err("error recipient_user_peer_id");
    }

    if (this.isNotString(info.channel_id)) {
      return err("empty channel_id");
    }

    let msg = new Message();
    msg.type = this.messageType.MsgType_HTLC_Close_ClientSign_Bob_C4b_111;
    msg.recipient_user_peer_id = recipient_user_peer_id;
    msg.recipient_node_peer_id = recipient_node_peer_id;
    msg.data = info;
    return new Promise(async (resolve) => this.sendData(msg, resolve));
  }

  /**
   * MsgType_HTLC_Close_ClientSign_Alice_C4b_112
   * @param info  SignedInfo100112
   */
  async sendSignedHex100112(info: SignedInfo100112) {
    if (this.isNotString(info.channel_id)) {
      return err("empty channel_id");
    }

    let msg = new Message();
    msg.type = this.messageType.MsgType_HTLC_Close_ClientSign_Alice_C4b_112;
    msg.data = info;
    return new Promise(async (resolve) => this.sendData(msg, resolve));
  }

  /**
   * MsgType_HTLC_Close_ClientSign_Alice_C4bSub_113
   * @param recipient_node_peer_id string
   * @param recipient_user_peer_id string
   * @param info  SignedInfo100113
   */
  async sendSignedHex100113(
    recipient_node_peer_id: string,
    recipient_user_peer_id: string,
    info: SignedInfo100113
  ) {
    if (this.isNotString(recipient_node_peer_id)) {
      return err("error recipient_node_peer_id");
    }

    if (this.isNotString(recipient_user_peer_id)) {
      return err("error recipient_user_peer_id");
    }

    if (this.isNotString(info.channel_id)) {
      return err("empty channel_id");
    }

    let msg = new Message();
    msg.type = this.messageType.MsgType_HTLC_Close_ClientSign_Alice_C4bSub_113;
    msg.recipient_user_peer_id = recipient_user_peer_id;
    msg.recipient_node_peer_id = recipient_node_peer_id;
    msg.data = info;
    return new Promise(async (resolve) => this.sendData(msg, resolve));
  }

  /**
   * MsgType_HTLC_Close_ClientSign_Bob_C4bSubResult_114
   * @param info  SignedInfo100114
   */
  async sendSignedHex100114(info: SignedInfo100114) {
    if (this.isNotString(info.channel_id)) {
      return err("empty channel_id");
    }

    let msg = new Message();
    msg.type = this.messageType.MsgType_HTLC_Close_ClientSign_Bob_C4bSubResult_114;
    msg.data = info;
    return new Promise(async (resolve) => this.sendData(msg, resolve));
  }

  /**
   * MsgType_HTLC_SendAddHTLCSigned_41
   * @param recipient_node_peer_id string
   * @param recipient_user_peer_id string
   * @param info HtlcSignedInfo
   */
  async htlcSigned(
    recipient_node_peer_id: string,
    recipient_user_peer_id: string,
    info: HtlcSignedInfo
  ) {
    if (this.isNotString(recipient_node_peer_id)) {
      return err("error recipient_node_peer_id");
    }
    if (this.isNotString(recipient_user_peer_id)) {
      return err("error recipient_user_peer_id");
    }
    if (this.isNotString(info.payer_commitment_tx_hash)) {
      return err("empty payer_commitment_tx_hash");
    }
    if (this.isNotString(info.curr_rsmc_temp_address_pub_key)) {
      return err("empty curr_rsmc_temp_address_pub_key");
    }
    if (this.isNotString(info.curr_htlc_temp_address_pub_key)) {
      return err("empty curr_htlc_temp_address_pub_key");
    }

    let msg = new Message();
    msg.type = this.messageType.MsgType_HTLC_SendAddHTLCSigned_41;
    msg.data = info;
    msg.recipient_user_peer_id = recipient_user_peer_id;
    msg.recipient_node_peer_id = recipient_node_peer_id;
    return new Promise(async (resolve) => this.sendData(msg, resolve));
  }

  onHtlcSigned(jsonData: any) {}

  /* ***************** backward R begin*****************/
  /**
   * MsgType_HTLC_SendVerifyR_45
   * @param recipient_node_peer_id string
   * @param recipient_user_peer_id string
   * @param info ForwardRInfo
   */
  async forwardR(
    recipient_node_peer_id: string,
    recipient_user_peer_id: string,
    info: ForwardRInfo
  ) {
    if (this.isNotString(recipient_node_peer_id)) {
      return err("error recipient_node_peer_id");
    }
    if (this.isNotString(recipient_user_peer_id)) {
      return err("error recipient_user_peer_id");
    }
    if (this.isNotString(info.channel_id)) {
      return err("empty channel_id");
    }

    if (this.isNotString(info.r)) {
      return err("empty r");
    }

    let msg = new Message();
    msg.type = this.messageType.MsgType_HTLC_SendVerifyR_45;
    msg.data = info;
    msg.recipient_user_peer_id = recipient_user_peer_id;
    msg.recipient_node_peer_id = recipient_node_peer_id;
    return new Promise(async (resolve) => this.sendData(msg, resolve));
  }

  onForwardR(jsonData: any) {}

  /**
   * MsgType_HTLC_SendSignVerifyR_46
   * @param recipient_node_peer_id string
   * @param recipient_user_peer_id string
   * @param info SignRInfo
   */
  async signR(
    recipient_node_peer_id: string,
    recipient_user_peer_id: string,
    info: SignRInfo
  ) {
    if (this.isNotString(recipient_node_peer_id)) {
      return err("error recipient_node_peer_id");
    }
    if (this.isNotString(recipient_user_peer_id)) {
      return err("error recipient_user_peer_id");
    }
    if (this.isNotString(info.channel_id)) {
      return err("empty channel_id");
    }

    let msg = new Message();
    msg.type = this.messageType.MsgType_HTLC_SendSignVerifyR_46;
    msg.data = info;
    msg.recipient_user_peer_id = recipient_user_peer_id;
    msg.recipient_node_peer_id = recipient_node_peer_id;
    return new Promise(async (resolve) => this.sendData(msg, resolve));
  }

  onSignR(jsonData: any) {}

  /* ***************** backward R end*****************/

  /* ***************** close htlc tx begin*****************/
  /**
   * MsgType_HTLC_SendRequestCloseCurrTx_49
   * @param recipient_node_peer_id string
   * @param recipient_user_peer_id string
   * @param info CloseHtlcTxInfo
   * */
  async closeHTLC(
    recipient_node_peer_id: string,
    recipient_user_peer_id: string,
    info: CloseHtlcTxInfo
  ) {
    if (this.isNotString(recipient_node_peer_id)) {
      return err("error recipient_node_peer_id");
    }
    if (this.isNotString(recipient_user_peer_id)) {
      return err("error recipient_user_peer_id");
    }
    if (this.isNotString(info.channel_id)) {
      return err("empty channel_id");
    }

    if (this.isNotString(info.last_rsmc_temp_address_private_key)) {
      return err("empty last_rsmc_temp_address_private_key");
    }
    if (this.isNotString(info.last_htlc_temp_address_private_key)) {
      return err("empty last_htlc_temp_address_private_key");
    }
    if (this.isNotString(info.last_htlc_temp_address_for_htnx_private_key)) {
      return err("empty last_htlc_temp_address_private_key");
    }
    if (this.isNotString(info.curr_temp_address_pub_key)) {
      return err("empty curr_rsmc_temp_address_pub_key");
    }

    let msg = new Message();
    msg.type = this.messageType.MsgType_HTLC_SendRequestCloseCurrTx_49;
    msg.data = info;
    msg.recipient_user_peer_id = recipient_user_peer_id;
    msg.recipient_node_peer_id = recipient_node_peer_id;
    return new Promise(async (resolve) => this.sendData(msg, resolve));
  }

  onCloseHTLC(jsonData: any) {}

  /**
   * MsgType_HTLC_SendCloseSigned_50
   * @param recipient_node_peer_id string
   * @param recipient_user_peer_id string
   * @param info CloseHtlcTxInfoSigned
   */
  async closeHTLCSigned(
    recipient_node_peer_id: string,
    recipient_user_peer_id: string,
    info: CloseHtlcTxInfoSigned
  ) {
    if (this.isNotString(recipient_node_peer_id)) {
      return err("error recipient_node_peer_id");
    }
    if (this.isNotString(recipient_user_peer_id)) {
      return err("error recipient_user_peer_id");
    }

    if (this.isNotString(info.msg_hash)) {
      return err("empty msg_hash");
    }
    if (this.isNotString(info.last_rsmc_temp_address_private_key)) {
      return err("empty last_rsmc_temp_address_private_key");
    }
    if (this.isNotString(info.last_htlc_temp_address_private_key)) {
      return err("empty last_htlc_temp_address_private_key");
    }
    if (this.isNotString(info.last_htlc_temp_address_for_htnx_private_key)) {
      return err("empty last_htlc_temp_address_for_htnx_private_key");
    }
    if (this.isNotString(info.curr_temp_address_pub_key)) {
      return err("empty curr_rsmc_temp_address_pub_key");
    }

    let msg = new Message();
    msg.type = this.messageType.MsgType_HTLC_SendCloseSigned_50;
    msg.recipient_user_peer_id = recipient_user_peer_id;
    msg.recipient_node_peer_id = recipient_node_peer_id;
    msg.data = info;
    return new Promise(async (resolve) => this.sendData(msg, resolve));
  }

  onCloseHTLCSigned(jsonData: any) {}

  /* ***************** close htlc tx end*****************/

  /* ********************* query data *************************** */
  /**
   * MsgType_Core_Omni_GetTransaction_2118
   * @param txid string
   */
  async getTransaction(txid: string) {
    if (this.isNotString(txid)) {
      return err("empty txid");
    }
    let msg = new Message();
    msg.type = this.messageType.MsgType_Core_Omni_GetTransaction_2118;
    msg.data["txid"] = txid;
    return new Promise(async (resolve) => this.sendData(msg, resolve));
  }

  onGetTransaction(jsonData: any) {}

  /**
   * MsgType_Core_Omni_CreateNewTokenFixed_2113
   * @param info IssueFixedAmountInfo
   */
  async issueFixedAmount(info: IssueFixedAmountInfo) {
    if (this.isNotString(info.from_address)) {
      return err("empty from_address");
    }
    if (this.isNotString(info.name)) {
      return err("empty name");
    }
    if (info.ecosystem == null) {
      return err("empty ecosystem");
    }
    if (info.divisible_type == null) {
      return err("empty divisible_type");
    }
    if (info.amount == null || info.amount <= 1) {
      return err("wrong amount");
    }
    if (this.isNotString(info.data)) {
      info.data = "";
    }

    let msg = new Message();
    msg.type = this.messageType.MsgType_Core_Omni_CreateNewTokenFixed_2113;
    msg.data = info;
    return new Promise(async (resolve) => this.sendData(msg, resolve));
  }

  onIssueFixedAmount(jsonData: any) {}

  /**
   * MsgType_Core_Omni_CreateNewTokenManaged_2114
   * @param info IssueManagedAmoutInfo
   */
  async issueManagedAmout(info: IssueManagedAmoutInfo) {
    if (this.isNotString(info.from_address)) {
      return err("empty from_address");
    }
    if (this.isNotString(info.name)) {
      return err("empty name");
    }
    if (info.ecosystem == null) {
      return err("empty ecosystem");
    }
    if (info.divisible_type == null) {
      return err("empty divisible_type");
    }
    if (this.isNotString(info.data)) {
      info.data = "";
    }
    let msg = new Message();
    msg.type = this.messageType.MsgType_Core_Omni_CreateNewTokenManaged_2114;
    msg.data = info;
    return new Promise(async (resolve) => this.sendData(msg, resolve));
  }

  onIssueManagedAmout(jsonData: any) {}

  /**
   * MsgType_Core_Omni_GrantNewUnitsOfManagedToken_2115
   * @param info OmniSendGrant
   */
  async sendGrant(info: OmniSendGrant) {
    if (this.isNotString(info.from_address)) {
      return err("empty from_address");
    }
    if (info.property_id == null || info.property_id < 1) {
      return err("empty property_id");
    }
    if (info.amount == null || info.amount <= 0) {
      return err("wrong amount");
    }
    if (this.isNotString(info.memo)) {
      info.memo = "";
    }

    let msg = new Message();
    msg.type = this.messageType.MsgType_Core_Omni_GrantNewUnitsOfManagedToken_2115;
    msg.data = info;
    return new Promise(async (resolve) => this.sendData(msg, resolve));
  }

  onSendGrant(jsonData: any) {}

  /**
   * MsgType_Core_Omni_RevokeUnitsOfManagedToken_2116
   * @param info OmniSendRevoke
   */
  async sendRevoke(info: OmniSendRevoke) {
    if (this.isNotString(info.from_address)) {
      return err("empty from_address");
    }
    if (info.property_id == null || info.property_id < 1) {
      return err("empty property_id");
    }
    if (info.amount == null || info.amount <= 0) {
      return err("wrong amount");
    }
    if (this.isNotString(info.memo)) {
      info.memo = "";
    }
    let msg = new Message();
    msg.type = this.messageType.MsgType_Core_Omni_RevokeUnitsOfManagedToken_2116;
    msg.data = info;
    return new Promise(async (resolve) => this.sendData(msg, resolve));
  }

  onSendRevoke(jsonData: any) {}

  /**
   * MsgType_Core_Omni_Getbalance_2112
   * @param address string
   */
  async getAllBalancesForAddress(address: string) {
    if (this.isNotString(address)) {
      return err("empty address");
    }
    let msg = new Message();
    msg.type = this.messageType.MsgType_Core_Omni_Getbalance_2112;
    msg.data["address"] = address;
    return new Promise(async (resolve) => this.sendData(msg, resolve));
  }

  onGetAllBalancesForAddress(jsonData: any) {}

  /**
   * MsgType_Core_Omni_GetProperty_2119
   * @param propertyId string
   */
  async getProperty(propertyId: string) {
    if (this.isNotString(propertyId)) {
      return err("empty propertyId");
    }
    let msg = new Message();
    msg.type = this.messageType.MsgType_Core_Omni_GetProperty_2119;
    msg.data["propertyId"] = propertyId;
    return new Promise(async (resolve) => this.sendData(msg, resolve));
  }

  onGetProperty(jsonData: any) {}

  /**
   * MsgType_Core_BalanceByAddress_2108
   * @param address string
   */
  async getBtcBalanceByAddress(address: string) {
    if (this.isNotString(address)) {
      return err("empty address");
    }
    let msg = new Message();
    msg.type = this.messageType.MsgType_Core_BalanceByAddress_2108;
    msg.data["address"] = address;
    return new Promise(async (resolve) => this.sendData(msg, resolve));
  }

  onGetBtcBalanceByAddress(jsonData: any) {}

  /**
   * MsgType_Core_Btc_ImportPrivKey_2111
   * @param privkey string
   */
  async importPrivKey(privkey: string) {
    if (this.isNotString(privkey)) {
      return err("empty privkey");
    }
    let msg = new Message();
    msg.type = this.messageType.MsgType_Core_Btc_ImportPrivKey_2111;
    msg.data["privkey"] = privkey;
    return new Promise(async (resolve) => this.sendData(msg, resolve));
  }

  onImportPrivKey(jsonData: any) {}

  /**
   * MsgType_HTLC_CreatedRAndHInfoList_N4001
   */
  async getAddHTLCRandHInfoList() {
    let msg = new Message();
    //msg.type = this.messageType.MsgType_HTLC_CreatedRAndHInfoList_N4001;
    return new Promise(async (resolve) => this.sendData(msg, resolve));
  }

  onGetAddHTLCRandHInfoList(jsonData: any) {}

  /**
   * MsgType_HTLC_SignedRAndHInfoList_N4101
   */
  async getHtlcSignedRandHInfoList() {
    let msg = new Message();
    // msg.type = this.messageType.MsgType_HTLC_SignedRAndHInfoList_N4101;
    return new Promise(async (resolve) => this.sendData(msg, resolve));
  }

  onGetHtlcSignedRandHInfoList(jsonData: any) {}

  /**
   * MsgType_HTLC_GetRFromLCommitTx_N4103
   * @param channel_id string
   */
  async getRFromCommitmentTx(channel_id: string) {
    if (this.isNotString(channel_id)) {
      return err("empty channel_id");
    }
    let msg = new Message();
    // msg.type = this.messageType.MsgType_HTLC_GetRFromLCommitTx_N4103;
    msg.data["channel_id"] = channel_id;
    return new Promise(async (resolve) => this.sendData(msg, resolve));
  }

  onGetRFromCommitmentTx(jsonData: any) {}

  /**
   * MsgType_HTLC_GetPathInfoByH_N4104
   * @param h string
   */
  async getPathInfoByH(h: string) {
    if (this.isNotString(h)) {
      return err("empty h");
    }
    let msg = new Message();
    // msg.type = this.messageType.MsgType_HTLC_GetPathInfoByH_N4104;
    msg.data = h;
    return new Promise(async (resolve) => this.sendData(msg, resolve));
  }

  onGetPathInfoByH(jsonData: any) {}

  /**
   * MsgType_HTLC_GetRInfoByHOfOwner_N4105
   * @param h string
   */
  async getRByHOfReceiver(h: string) {
    if (this.isNotString(h)) {
      return err("empty h");
    }
    let msg = new Message();
    // msg.type = this.messageType.MsgType_HTLC_GetRInfoByHOfOwner_N4105;
    msg.data = h;
    return new Promise(async (resolve) => this.sendData(msg, resolve));
  }

  onGetRByHOfReceiver(jsonData: any) {}

  /**
   * MsgType_CommitmentTx_LatestCommitmentTxByChanId_3203
   * @param channel_id string
   */
  async getLatestCommitmentTransaction(channel_id: string) {
    if (this.isNotString(channel_id)) {
      return err("empty channel_id");
    }
    let msg = new Message();
    msg.type = this.messageType.MsgType_CommitmentTx_LatestCommitmentTxByChanId_3203;
    msg.data["channel_id"] = channel_id;
    return new Promise(async (resolve) => this.sendData(msg, resolve));
  }

  onGetLatestCommitmentTransaction(jsonData: any) {}

  /**
   * MsgType_CommitmentTx_ItemsByChanId_3200
   * @param channel_id string
   */
  async getItemsByChannelId(channel_id: string) {
    if (this.isNotString(channel_id)) {
      return err("empty channel_id");
    }
    let msg = new Message();
    msg.type = this.messageType.MsgType_CommitmentTx_ItemsByChanId_3200;
    msg.data["channel_id"] = channel_id;
    return new Promise(async (resolve) => this.sendData(msg, resolve));
  }

  onGetItemsByChannelId(jsonData: any) {}

  /**
   * MsgType_ChannelOpen_AllItem_3150
   * @param page_size Number
   * @param page_index Number
   */
  async getMyChannels(page_size: Number, page_index: Number) {
    if (page_size == null || page_size <= 0) {
      page_size = 10;
    }

    if (page_index == null || page_index <= 0) {
      page_index = 1;
    }

    let msg = new Message();
    msg.type = this.messageType.MsgType_ChannelOpen_AllItem_3150;
    msg.data["page_size"] = page_size;
    msg.data["page_index"] = page_index;
    return new Promise(async (resolve) => this.sendData(msg, resolve));
  }

  onGetMyChannels(jsonData: any) {}

  /**
   * MsgType_GetMiniBtcFundAmount_2006
   */
  async getAmountOfRechargeBTC() {
    let msg = new Message();
    msg.type = this.messageType.MsgType_GetMiniBtcFundAmount_2006;
    return new Promise(async (resolve) => this.sendData(msg, resolve));
  }

  onGetAmountOfRechargeBTC(jsonData: any) {}

  /**
   * MsgType_GetChannelInfoByChannelId_3154
   * @param channel_id string
   */
  async getChannelDetailFromChannelID(channel_id: string) {
    if (this.isNotString(channel_id)) {
      return err("empty channel_id");
    }
    let msg = new Message();
    msg.type = this.messageType.MsgType_GetChannelInfoByChannelId_3154;
    msg.data = channel_id;
    // msg.data["channel_id"] = channel_id;
    return new Promise(async (resolve) => this.sendData(msg, resolve));
  }

  onGetChannelDetailFromChannelID(jsonData: any) {}

  /**
   * MsgType_GetChannelInfoByDbId_3155
   * @param id number
   */
  async getChannelDetailFromDatabaseID(id: number) {
    if (id == null || id <= 0) {
      return err("error id");
    }
    let msg = new Message();
    msg.type = this.messageType.MsgType_GetChannelInfoByDbId_3155;
    msg.data = id;
    return new Promise(async (resolve) => this.sendData(msg, resolve));
  }

  onGetChannelDetailFromDatabaseID(jsonData: any) {}

  /**
   * MsgType_CommitmentTx_AllBRByChanId_3208
   * @param channel_id string
   */
  async getAllBreachRemedyTransactions(channel_id: string) {
    if (this.isNotString(channel_id)) {
      return err("empty channel_id");
    }
    let msg = new Message();
    msg.type = this.messageType.MsgType_CommitmentTx_AllBRByChanId_3208;
    msg.data["channel_id"] = channel_id;
    return new Promise(async (resolve) => this.sendData(msg, resolve));
  }

  onGetAllBreachRemedyTransactions(jsonData: any) {}

  /**
   * MsgType_CommitmentTx_ItemsByChanId_3200
   * @param channel_id string
   */
  async getAllCommitmentTx(channel_id: string) {
    if (this.isNotString(channel_id)) {
      return err("empty channel_id");
    }
    let msg = new Message();
    msg.type = this.messageType.MsgType_CommitmentTx_ItemsByChanId_3200;
    msg.data["channel_id"] = channel_id;
    return new Promise(async (resolve) => this.sendData(msg, resolve));
  }

  onGetAllCommitmentTx(jsonData: any) {}

  /**
   * MsgType_CommitmentTx_LatestRDByChanId_3204
   * @param channel_id string
   */
  async getLatestRevockableDeliveryTransaction(channel_id: string) {
    if (this.isNotString(channel_id)) {
      return err("empty channel_id");
    }
    let msg = new Message();
    msg.type = this.messageType.MsgType_CommitmentTx_LatestRDByChanId_3204;
    msg.data["channel_id"] = channel_id;
    return new Promise(async (resolve) => this.sendData(msg, resolve));
  }

  onGetLatestRevockableDeliveryTransaction(jsonData: any) {}

  /**
   * MsgType_CommitmentTx_LatestBRByChanId_3205
   * @param channel_id string
   */
  async getLatestBreachRemedyTransaction(channel_id: string) {
    if (this.isNotString(channel_id)) {
      return err("empty channel_id");
    }
    let msg = new Message();
    msg.type = this.messageType.MsgType_CommitmentTx_LatestBRByChanId_3205;
    msg.data["channel_id"] = channel_id;
    return new Promise(async (resolve) => this.sendData(msg, resolve));
  }

  onGetLatestBreachRemedyTransaction(jsonData: any) {}

  /**
   * MsgType_CommitmentTx_SendSomeCommitmentById_3206
   * @param id number
   */
  async sendSomeCommitmentById(id: number) {
    if (id == null || id < 0) {
      return err("error id");
    }
    let msg = new Message();
    msg.type = this.messageType.MsgType_CommitmentTx_SendSomeCommitmentById_3206;
    msg.data = id;
    return new Promise(async (resolve) => this.sendData(msg, resolve));
  }

  onSendSomeCommitmentById(jsonData: any) {}

  /**
   * MsgType_CommitmentTx_AllRDByChanId_3207
   * @param channel_id string
   */
  async getAllRevockableDeliveryTransactions(channel_id: string) {
    if (this.isNotString(channel_id)) {
      return err("empty channel_id");
    }
    let msg = new Message();
    msg.type = this.messageType.MsgType_CommitmentTx_AllRDByChanId_3207;
    msg.data["channel_id"] = channel_id;
    return new Promise(async (resolve) => this.sendData(msg, resolve));
  }

  onGetAllRevockableDeliveryTransactions(jsonData: any) {}

  /**
   * MsgType_SendCloseChannelRequest_38
   * @param recipient_node_peer_id string
   * @param recipient_user_peer_id string
   * @param channel_id string
   */
  async closeChannel(
    recipient_node_peer_id: string,
    recipient_user_peer_id: string,
    channel_id: string
  ) {
    if (this.isNotString(recipient_node_peer_id)) {
      return err("error recipient_node_peer_id");
    }

    if (this.isNotString(recipient_user_peer_id)) {
      return err("error recipient_user_peer_id");
    }

    if (this.isNotString(channel_id)) {
      return err("empty channel_id");
    }
    let msg = new Message();
    msg.type = this.messageType.MsgType_SendCloseChannelRequest_38;
    msg.data["channel_id"] = channel_id;
    msg.recipient_user_peer_id = recipient_user_peer_id;
    msg.recipient_node_peer_id = recipient_node_peer_id;
    return new Promise(async (resolve) => this.sendData(msg, resolve));
  }

  onCloseChannel(jsonData: any) {}

  /**
   * MsgType_SendCloseChannelSign_39
   * @param recipient_node_peer_id string
   * @param recipient_user_peer_id string
   * @param info CloseChannelSign
   */
  async closeChannelSigned(
    recipient_node_peer_id: string,
    recipient_user_peer_id: string,
    info: CloseChannelSign
  ) {
    if (this.isNotString(recipient_node_peer_id)) {
      return err("error recipient_node_peer_id");
    }

    if (this.isNotString(recipient_user_peer_id)) {
      return err("error recipient_user_peer_id");
    }

    if (this.isNotString(info.channel_id)) {
      return err("empty channel_id");
    }

    if (info.approval == null) {
      info.approval = false;
    }

    if (info.approval) {
      if (this.isNotString(info.request_close_channel_hash)) {
        return err("empty request_close_channel_hash");
      }
    }

    let msg = new Message();
    msg.type = this.messageType.MsgType_SendCloseChannelSign_39;
    msg.data = info;
    msg.recipient_user_peer_id = recipient_user_peer_id;
    msg.recipient_node_peer_id = recipient_node_peer_id;
    return new Promise(async (resolve) => this.sendData(msg, resolve));
  }

  onCloseChannelSigned(jsonData: any) {}

  /**
   * MsgType_Atomic_SendSwap_80
   * @param recipient_node_peer_id string
   * @param recipient_user_peer_id string
   * @param info AtomicSwapRequest
   */
  async atomicSwap(
    recipient_node_peer_id: string,
    recipient_user_peer_id: string,
    info: AtomicSwapRequest
  ) {
    if (this.isNotString(recipient_node_peer_id)) {
      return err("error recipient_node_peer_id");
    }

    if (this.isNotString(recipient_user_peer_id)) {
      return err("error recipient_user_peer_id");
    }

    if (this.isNotString(info.channel_id_from)) {
      return err("empty channel_id_from");
    }
    if (this.isNotString(info.channel_id_to)) {
      return err("empty channel_id_to");
    }
    if (this.isNotString(info.recipient_user_peer_id)) {
      return err("empty recipient_user_peer_id");
    }
    if (this.isNotString(info.transaction_id)) {
      return err("empty transaction_id");
    }

    if (info.property_sent <= 0) {
      return err("wrong property_sent");
    }
    if (info.amount <= 0) {
      return err("wrong amount");
    }
    if (info.exchange_rate <= 0) {
      return err("wrong exchange_rate");
    }
    if (info.property_received <= 0) {
      return err("wrong property_received");
    }

    let msg = new Message();
    msg.type = this.messageType.MsgType_Atomic_SendSwap_80;
    msg.data = info;
    msg.recipient_user_peer_id = recipient_user_peer_id;
    msg.recipient_node_peer_id = recipient_node_peer_id;
    return new Promise(async (resolve) => this.sendData(msg, resolve));
  }

  /**
   * MsgType_Atomic_SendSwapAccept_81
   * @param recipient_node_peer_id string
   * @param recipient_user_peer_id string
   * @param info AtomicSwapAccepted
   */
  async atomicSwapAccepted(
    recipient_node_peer_id: string,
    recipient_user_peer_id: string,
    info: AtomicSwapAccepted
  ) {
    if (this.isNotString(recipient_node_peer_id)) {
      return err("error recipient_node_peer_id");
    }

    if (this.isNotString(recipient_user_peer_id)) {
      return err("error recipient_user_peer_id");
    }

    if (this.isNotString(info.channel_id_from)) {
      return err("empty channel_id_from");
    }
    if (this.isNotString(info.channel_id_to)) {
      return err("empty channel_id_to");
    }
    if (this.isNotString(info.recipient_user_peer_id)) {
      return err("empty recipient_user_peer_id");
    }
    if (this.isNotString(info.transaction_id)) {
      return err("empty transaction_id");
    }
    if (this.isNotString(info.target_transaction_id)) {
      return err("empty target_transaction_id");
    }
    if (info.property_sent <= 0) {
      return err("wrong property_sent");
    }
    if (info.amount <= 0) {
      return err("wrong amount");
    }
    if (info.exchange_rate <= 0) {
      return err("wrong exchange_rate");
    }
    if (info.property_received <= 0) {
      return err("wrong property_received");
    }

    let msg = new Message();
    msg.type = this.messageType.MsgType_Atomic_SendSwapAccept_81;
    msg.data = info;
    msg.recipient_user_peer_id = recipient_user_peer_id;
    msg.recipient_node_peer_id = recipient_node_peer_id;
    return new Promise(async (resolve) => this.sendData(msg, resolve));
  }

  isNotString(str: String): boolean {
    if (str == null) {
      return true;
    }
    return str.trim().length == 0;
  }
}
