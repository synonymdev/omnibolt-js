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

const DEFAULT_URL = "62.234.216.108:60020";

export default class ObdApi {
  constructor({ url = DEFAULT_URL } = {}) {
    this.defaultUrl = url;
  }

  private isConnectedToOBD: boolean = false;
  private isLoggedIn: boolean = false;
  private messageType: MessageType = new MessageType();
  private ws: WebSocket | any;
  private defaultUrl: string;
  private globalCallback: Function | undefined;
  private callbackMap: Map<number, Function> = new Map<number, Function>();
  private onMessage: Function | undefined;
  public onChannelOpenAttempt: Function | undefined;
  public onBitcoinFundingCreated: Function | undefined;
  public onChannelClose: Function | undefined;
  public onAssetFundingCreated: Function | undefined;

  public loginData = {
    nodeAddress: "",
    nodePeerId: "",
    userPeerId: ""
  };

  public failure(data): { error: boolean; data: string | Object } {
    return { error: true, data };
  }

  public success(data): { error: boolean; data: string | Object } {
    return { error: false, data };
  }

  public connect({
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
  } = {}): Promise<{ error: boolean; data: string | Object }> {
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
          }
          console.log(e);
          resolve(this.success(jsonData));
        } catch (e) {
          console.log(e);
          if (this.onMessage) this.onMessage(e);
          resolve(this.failure(e));
        }
      };

      this.ws.onerror = (e) => {
        // an error occurred
        console.log("Error!");
        console.log(e);
        this.disconnect();
        onError(e.message);
        resolve(this.failure(e.message));
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
  public registerEvent(msgType: number, callback: Function) {
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
  public removeEvent(msgType: number) {
    this.callbackMap.delete(msgType);
    console.info("----------> removeEvent");
  }

  /**
   * Send custom request
   * @param msg
   * @param type
   * @param callback
   */
  public sendJsonData(msg: string, type: number, callback: Function) {
    if (!this.isConnectedToOBD) {
      alert("please try to connect obd again");
      return;
    }

    if (this.isNotString(msg)) {
      alert("error request content.");
      return;
    }

    console.info(new Date(), "------send json msg------");
    console.info(msg);

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
  public connectToServer(
    url: string,
    callback: Function,
    globalCallback: Function
  ) {
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
        alert("ws close");
      };

      this.ws.onerror = (e) => {
        console.info("ws error", e);
        alert("ws error");
      };
    } catch (error) {
      console.info(error);
      alert("can not connect to server");
      return;
    }
  }

  private sendData(msg: Message, callback: Function) {
    if (!this.isConnectedToOBD) {
      alert("please try to connect obd again");
      return;
    }

    if (
      ((msg.type <= -100000 && msg.type >= -102000) ||
        (msg.type <= -103000 && msg.type >= -104000)) &&
      this.isLoggedIn == false
    ) {
      alert("please login");
      return;
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

  private getDataFromServer(jsonData: any) {
    console.info(jsonData);

    if (this.globalCallback) this.globalCallback(jsonData);

    let callback = this.callbackMap[jsonData.type];
    if (jsonData.type == 0) return;

    if (jsonData.status == false) {
      //omni error ,do not alert
      if (jsonData.type == this.messageType.MsgType_Core_Omni_Getbalance_2112) {
        try {
          if (callback != null) return callback(this.failure("Omni Error"));
        } catch {
          return this.failure(jsonData);
        }
      }

      if (jsonData.type !== this.messageType.MsgType_Error_0) {
        alert(jsonData.result);
      }

      try {
        if (callback != null) return callback(this.failure(jsonData));
      } catch {
        return this.failure(jsonData);
      }
      return this.failure(jsonData);
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
          return callback(this.success(resultData));
        } catch {
          return this.failure(jsonData);
        }
      }
      return;
    }

    // This message is send to myself
    if (callback != null) callback(this.success(resultData));

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
   * @param callback function
   */
  public logIn(mnemonic: string, callback: Function) {
    if (this.isLoggedIn) {
      if (callback !== null) {
        callback("already logined");
        alert("You are already logged in!");
      }
      return;
    }

    if (this.isNotString(mnemonic)) {
      alert("empty mnemonic");
      return;
    }

    let msg = new Message();
    msg.type = this.messageType.MsgType_UserLogin_2001;
    msg.data["mnemonic"] = mnemonic;
    this.sendData(msg, callback);
  }

  public userPeerId: string = "";

  public onLogIn(resultData: any) {
    if (!this.isLoggedIn) this.isLoggedIn = true;
  }

  public disconnect() {
    this.ws.close();
  }

  /**
   * MsgType_UserLogout_2002
   * @param callback function
   */
  public logout(callback: Function) {
    if (this.isLoggedIn) {
      let msg = new Message();
      msg.type = this.messageType.MsgType_UserLogout_2002;
      this.sendData(msg, callback);
    } else {
      alert("you have logout");
    }
  }

  public onLogout(jsonData: any) {
    this.isLoggedIn = false;
  }

  /**
   * MsgType_p2p_ConnectPeer_2003
   * @param info P2PPeer
   * @param callback function
   */
  public connectPeer(info: P2PPeer, callback: Function) {
    if (this.isNotString(info.remote_node_address)) {
      alert("empty remote_node_address");
      return;
    }

    let msg = new Message();
    msg.data = info;
    msg.type = this.messageType.MsgType_p2p_ConnectPeer_2003;
    this.sendData(msg, callback);
  }

  /**
   * MsgType_Core_GetNewAddress_2101
   * @param callback function
   */
  // public getNewAddress(callback: Function) {
  //   let msg = new Message();
  //   msg.type = this.messageType.MsgType_Core_GetNewAddress_2101;
  //   this.sendData(msg, callback);
  // }
  // public onGetNewAddressFromOmniCore(jsonData: any) {}

  /**
   * MsgType_Core_FundingBTC_2109
   * @param info BtcFundingInfo
   * @param callback function
   */
  public fundingBitcoin(info: BtcFundingInfo, callback: Function) {
    if (this.isNotString(info.from_address)) {
      alert("empty from_address");
      return;
    }
    if (this.isNotString(info.to_address)) {
      alert("empty to_address");
      return;
    }
    if (info.amount == null || info.amount <= 0) {
      alert("wrong amount");
      return;
    }
    if (info.miner_fee == null || info.miner_fee <= 0) {
      info.miner_fee = 0;
    }

    let msg = new Message();
    msg.type = this.messageType.MsgType_Core_FundingBTC_2109;
    msg.data = info;
    this.sendData(msg, callback);
  }

  public onFundingBitcoin(jsonData: any) {}

  /**
   * MsgType_FundingCreate_SendBtcFundingCreated_340
   * @param recipient_node_peer_id string
   * @param recipient_user_peer_id string
   * @param info  FundingBtcCreated
   * @param callback  Function
   */
  public bitcoinFundingCreated(
    recipient_node_peer_id: string,
    recipient_user_peer_id: string,
    info: FundingBtcCreated,
    callback: Function
  ) {
    if (this.isNotString(recipient_node_peer_id)) {
      alert("error recipient_node_peer_id");
      return;
    }

    if (this.isNotString(recipient_user_peer_id)) {
      alert("error recipient_user_peer_id");
      return;
    }

    if (this.isNotString(info.temporary_channel_id)) {
      alert("empty temporary_channel_id");
      return;
    }
    if (this.isNotString(info.funding_tx_hex)) {
      alert("empty funding_tx_hex");
      return;
    }

    let msg = new Message();
    msg.type = this.messageType.MsgType_FundingCreate_SendBtcFundingCreated_340;
    msg.recipient_user_peer_id = recipient_user_peer_id;
    msg.recipient_node_peer_id = recipient_node_peer_id;
    msg.data = info;
    this.sendData(msg, callback);
  }

  /**
   * MsgType_FundingCreate_BtcFundingMinerRDTxToClient_341
   * @param recipient_node_peer_id string
   * @param recipient_user_peer_id string
   * @param signed_hex  string
   * @param callback  Function
   */
  public sendSignedHex100341(
    recipient_node_peer_id: string,
    recipient_user_peer_id: string,
    signed_hex: string,
    callback: Function
  ) {
    if (this.isNotString(recipient_node_peer_id)) {
      alert("error recipient_node_peer_id");
      return;
    }

    if (this.isNotString(recipient_user_peer_id)) {
      alert("error recipient_user_peer_id");
      return;
    }

    let msg = new Message();
    msg.type = this.messageType.MsgType_FundingCreate_BtcFundingMinerRDTxToClient_341;
    msg.recipient_user_peer_id = recipient_user_peer_id;
    msg.recipient_node_peer_id = recipient_node_peer_id;
    msg.data["hex"] = signed_hex;
    this.sendData(msg, callback);
  }

  /**
   * MsgType_FundingSign_SendBtcSign_350
   * @param recipient_node_peer_id string
   * @param recipient_user_peer_id string
   * @param info FundingBtcSigned
   * @param callback  Function
   */
  public bitcoinFundingSigned(
    recipient_node_peer_id: string,
    recipient_user_peer_id: string,
    info: FundingBtcSigned,
    callback: Function
  ) {
    if (this.isNotString(recipient_node_peer_id)) {
      return callback(this.failure("error recipient_node_peer_id"));
    }

    if (this.isNotString(recipient_user_peer_id)) {
      return callback(this.failure("error recipient_user_peer_id"));
    }

    if (this.isNotString(info.temporary_channel_id)) {
      return callback(this.failure("empty temporary_channel_id"));
    }
    if (this.isNotString(info.funding_txid)) {
      return callback(this.failure("empty funding_txid"));
    }
    if (this.isNotString(info.signed_miner_redeem_transaction_hex)) {
      return callback(
        this.failure("empty signed_miner_redeem_transaction_hex")
      );
    }

    let msg = new Message();
    msg.type = this.messageType.MsgType_FundingSign_SendBtcSign_350;
    msg.recipient_user_peer_id = recipient_user_peer_id;
    msg.recipient_node_peer_id = recipient_node_peer_id;
    msg.data = info;
    this.sendData(msg, callback);
  }

  /**
   * MsgType_Core_Omni_ListProperties_2117
   * @param callback function
   */
  public listProperties(callback: Function) {
    let msg = new Message();
    msg.type = this.messageType.MsgType_Core_Omni_ListProperties_2117;
    this.sendData(msg, callback);
  }

  public onListProperties(jsonData: any) {}

  /**
   * MsgType_Core_Omni_FundingAsset_2120
   * @param info OmniFundingAssetInfo
   * @param callback function
   */
  public fundingAsset(info: OmniFundingAssetInfo, callback: Function) {
    if (this.isNotString(info.from_address)) {
      return callback(this.failure("empty from_address"));
    }
    if (this.isNotString(info.to_address)) {
      return callback(this.failure("empty to_address"));
    }
    if (info.property_id == null || info.property_id <= 0) {
      return callback(this.failure("error property_id"));
    }

    if (info.amount == null || info.amount <= 0) {
      return callback(this.failure("Incorrect amount"));
    }
    if (info.miner_fee == null || info.miner_fee <= 0) {
      info.miner_fee = 0;
    }

    let msg = new Message();
    msg.type = this.messageType.MsgType_Core_Omni_FundingAsset_2120;
    msg.data = info;
    this.sendData(msg, callback);
  }

  public onFundingAsset(jsonData: any) {}

  /**
   * MsgType_Core_Omni_Send_2121
   * @param info OmniSendAssetInfo
   * @param callback function
   */
  public sendAsset(info: OmniSendAssetInfo, callback: Function) {
    if (this.isNotString(info.from_address)) {
      return callback(this.failure("empty from_address"));
    }
    if (this.isNotString(info.to_address)) {
      return callback(this.failure("empty to_address"));
    }
    if (info.property_id == null || info.property_id <= 0) {
      return callback(this.failure("error property_id"));
    }

    if (info.amount == null || info.amount <= 0) {
      return callback(this.failure("wrong amount"));
    }

    let msg = new Message();
    msg.type = this.messageType.MsgType_Core_Omni_Send_2121;
    msg.data = info;
    this.sendData(msg, callback);
  }

  public onSendAsset(jsonData: any) {}

  /**
   * MsgType_Mnemonic_CreateAddress_3000
   * @param callback function
   */
  public genAddressFromMnemonic(callback: Function) {
    let msg = new Message();
    msg.type = this.messageType.MsgType_Mnemonic_CreateAddress_3000;
    this.sendData(msg, callback);
  }

  public onGenAddressFromMnemonic(jsonData: any) {}

  /**
   * MsgType_Mnemonic_GetAddressByIndex_3001
   * @param index:number
   * @param callback function
   */
  public getAddressInfo(index: number, callback: Function) {
    if (index == null || index < 0) {
      return callback(this.failure("error index"));
    }

    let msg: Message = new Message();
    msg.type = this.messageType.MsgType_Mnemonic_GetAddressByIndex_3001;
    msg.data = index;
    this.sendData(msg, callback);
  }

  public onGetAddressInfo(jsonData: any) {}

  /**
   * MsgType_SendChannelOpen_32
   * @param recipient_node_peer_id string
   * @param recipient_user_peer_id string
   * @param info OpenChannelInfo
   * @param callback function
   */
  public openChannel(
    recipient_node_peer_id: string,
    recipient_user_peer_id: string,
    info: OpenChannelInfo,
    callback: Function
  ) {
    if (this.isNotString(recipient_node_peer_id)) {
      return callback(this.failure("error recipient_node_peer_id"));
    }

    if (this.isNotString(recipient_user_peer_id)) {
      return callback(this.failure("error recipient_user_peer_id"));
    }

    if (this.isNotString(info.funding_pubkey)) {
      return callback(this.failure("error funding_pubkey"));
    }

    if (info.is_private == null) {
      info.is_private = false;
    }

    let msg = new Message();
    msg.type = this.messageType.MsgType_SendChannelOpen_32;
    msg.recipient_node_peer_id = recipient_node_peer_id;
    msg.recipient_user_peer_id = recipient_user_peer_id;
    msg.data = info;
    this.sendData(msg, callback);
  }

  public onOpenChannel(jsonData: any) {}

  /**
   * MsgType_SendChannelAccept_33
   * @param recipient_node_peer_id string
   * @param recipient_user_peer_id string
   * @param info AcceptChannelInfo
   * @param callback function
   */
  public acceptChannel(
    recipient_node_peer_id: string,
    recipient_user_peer_id: string,
    info: AcceptChannelInfo,
    callback: Function
  ) {
    if (this.isNotString(recipient_node_peer_id)) {
      return callback(this.failure("error recipient_node_peer_id"));
    }

    if (this.isNotString(recipient_user_peer_id)) {
      return callback(this.failure("error recipient_user_peer_id"));
    }

    if (this.isNotString(info.temporary_channel_id)) {
      return callback(this.failure("empty temporary_channel_id"));
    }

    if (info.approval == null) {
      info.approval = false;
    }

    if (info.approval) {
      if (this.isNotString(info.funding_pubkey)) {
        return callback(this.failure("empty funding_pubkey"));
      }
    }

    let msg = new Message();
    msg.type = this.messageType.MsgType_SendChannelAccept_33;
    msg.recipient_node_peer_id = recipient_node_peer_id;
    msg.recipient_user_peer_id = recipient_user_peer_id;
    msg.data = info;
    this.sendData(msg, callback);
  }

  public onAcceptChannel(jsonData: any) {}

  /**
   * MsgType_CheckChannelAddessExist_3156
   * Parameters same to type 33
   *
   * @param recipient_node_peer_id string
   * @param recipient_user_peer_id string
   * @param info AcceptChannelInfo
   * @param callback function
   */
  public checkChannelAddessExist(
    recipient_node_peer_id: string,
    recipient_user_peer_id: string,
    info: AcceptChannelInfo,
    callback: Function
  ) {
    if (this.isNotString(recipient_node_peer_id)) {
      return callback(this.failure("error recipient_node_peer_id"));
    }

    if (this.isNotString(recipient_user_peer_id)) {
      return callback(this.failure("error recipient_user_peer_id"));
    }

    if (this.isNotString(info.temporary_channel_id)) {
      return callback(this.failure("empty temporary_channel_id"));
    }

    if (info.approval == null) {
      info.approval = false;
    }

    if (info.approval) {
      if (this.isNotString(info.funding_pubkey)) {
        return callback(this.failure("empty funding_pubkey"));
      }
    }

    let msg = new Message();
    msg.type = this.messageType.MsgType_CheckChannelAddessExist_3156;
    msg.recipient_node_peer_id = recipient_node_peer_id;
    msg.recipient_user_peer_id = recipient_user_peer_id;
    msg.data = info;
    this.sendData(msg, callback);
  }

  public onCheckChannelAddessExist(jsonData: any) {}

  /**
   * MsgType_FundingCreate_SendAssetFundingCreated_34
   * @param recipient_node_peer_id string
   * @param recipient_user_peer_id string
   * @param info AssetFundingCreatedInfo
   * @param callback function
   */
  public assetFundingCreated(
    recipient_node_peer_id: string,
    recipient_user_peer_id: string,
    info: AssetFundingCreatedInfo,
    callback: Function
  ) {
    if (this.isNotString(recipient_node_peer_id)) {
      return callback(this.failure("error recipient_node_peer_id"));
    }

    if (this.isNotString(recipient_user_peer_id)) {
      return callback(this.failure("error recipient_user_peer_id"));
    }

    if (this.isNotString(info.temporary_channel_id)) {
      return callback(this.failure("empty temporary_channel_id"));
    }
    if (this.isNotString(info.funding_tx_hex)) {
      return callback(this.failure("empty funding_tx_hex"));
    }
    if (this.isNotString(info.temp_address_pub_key)) {
      return callback(this.failure("empty temp_address_pub_key"));
    }

    let msg = new Message();
    msg.type = this.messageType.MsgType_FundingCreate_SendAssetFundingCreated_34;
    msg.recipient_user_peer_id = recipient_user_peer_id;
    msg.recipient_node_peer_id = recipient_node_peer_id;
    msg.data = info;
    this.sendData(msg, callback);
  }

  /**
   * MsgType_ClientSign_AssetFunding_AliceSignC1a_1034
   * @param recipient_node_peer_id string
   * @param recipient_user_peer_id string
   * @param signed_hex  string
   * @param callback  Function
   */
  public sendSignedHex101034(
    recipient_node_peer_id: string,
    recipient_user_peer_id: string,
    signed_hex: string,
    callback: Function
  ) {
    if (this.isNotString(recipient_node_peer_id)) {
      return callback(this.failure("error recipient_node_peer_id"));
    }

    if (this.isNotString(recipient_user_peer_id)) {
      return callback(this.failure("error recipient_user_peer_id"));
    }

    let msg = new Message();
    msg.type = this.messageType.MsgType_ClientSign_AssetFunding_AliceSignC1a_1034;
    msg.recipient_user_peer_id = recipient_user_peer_id;
    msg.recipient_node_peer_id = recipient_node_peer_id;
    msg.data["signed_c1a_hex"] = signed_hex;
    this.sendData(msg, callback);
  }

  /**
   * MsgType_ClientSign_AssetFunding_AliceSignRD_1134
   * @param info      SignedInfo101134
   * @param callback  Function
   */
  public sendSignedHex101134(info: SignedInfo101134, callback: Function) {
    if (this.isNotString(info.channel_id)) {
      return callback(this.failure("empty channel_id"));
    }

    let msg = new Message();
    msg.type = this.messageType.MsgType_ClientSign_AssetFunding_AliceSignRD_1134;
    msg.data = info;
    this.sendData(msg, callback);
  }

  /**
   * MsgType_FundingSign_SendAssetFundingSigned_35
   * @param recipient_node_peer_id string
   * @param recipient_user_peer_id string
   * @param info AssetFundingSignedInfo
   * @param callback function
   */
  public assetFundingSigned(
    recipient_node_peer_id: string,
    recipient_user_peer_id: string,
    info: AssetFundingSignedInfo,
    callback: Function
  ) {
    if (this.isNotString(recipient_node_peer_id)) {
      return callback(this.failure("error recipient_node_peer_id"));
    }

    if (this.isNotString(recipient_user_peer_id)) {
      return callback(this.failure("error recipient_user_peer_id"));
    }

    if (this.isNotString(info.temporary_channel_id)) {
      return callback(this.failure("empty temporary_channel_id"));
    }

    if (this.isNotString(info.signed_alice_rsmc_hex)) {
      return callback(this.failure("empty signed_alice_rsmc_hex"));
    }

    let msg = new Message();
    msg.type = this.messageType.MsgType_FundingSign_SendAssetFundingSigned_35;
    msg.recipient_user_peer_id = recipient_user_peer_id;
    msg.recipient_node_peer_id = recipient_node_peer_id;
    msg.data = info;
    this.sendData(msg, callback);
  }

  public onAssetFundingSigned(jsonData: any) {}

  /**
   * MsgType_ClientSign_Duplex_AssetFunding_RdAndBr_1035
   * @param recipient_node_peer_id string
   * @param recipient_user_peer_id string
   * @param info  SignedInfo101035
   * @param callback  Function
   */
  public sendSignedHex101035(
    recipient_node_peer_id: string,
    recipient_user_peer_id: string,
    info: SignedInfo101035,
    callback: Function
  ) {
    if (this.isNotString(recipient_node_peer_id)) {
      return callback(this.failure("error recipient_node_peer_id"));
    }

    if (this.isNotString(recipient_user_peer_id)) {
      return callback(this.failure("error recipient_user_peer_id"));
    }

    if (this.isNotString(info.temporary_channel_id)) {
      return callback(this.failure("empty temporary_channel_id"));
    }

    let msg = new Message();
    msg.type = this.messageType.MsgType_ClientSign_Duplex_AssetFunding_RdAndBr_1035;
    msg.recipient_user_peer_id = recipient_user_peer_id;
    msg.recipient_node_peer_id = recipient_node_peer_id;
    msg.data = info;
    this.sendData(msg, callback);
  }

  /**
   * MsgType_CommitmentTx_SendCommitmentTransactionCreated_351
   * @param recipient_node_peer_id string
   * @param recipient_user_peer_id string
   * @param info CommitmentTx
   * @param callback function
   */
  public commitmentTransactionCreated(
    recipient_node_peer_id: string,
    recipient_user_peer_id: string,
    info: CommitmentTx,
    callback: Function
  ) {
    if (this.isNotString(recipient_node_peer_id)) {
      return callback(this.failure("error recipient_node_peer_id"));
    }

    if (this.isNotString(recipient_user_peer_id)) {
      return callback(this.failure("error recipient_user_peer_id"));
    }

    if (this.isNotString(info.channel_id)) {
      return callback(this.failure("empty channel_id"));
    }
    if (this.isNotString(info.curr_temp_address_pub_key)) {
      return callback(this.failure("empty curr_temp_address_pub_key"));
    }
    if (info.amount == null || info.amount <= 0) {
      return callback(this.failure("wrong amount"));
    }

    let msg = new Message();
    msg.type = this.messageType.MsgType_CommitmentTx_SendCommitmentTransactionCreated_351;
    msg.recipient_user_peer_id = recipient_user_peer_id;
    msg.recipient_node_peer_id = recipient_node_peer_id;
    msg.data = info;
    this.sendData(msg, callback);
  }

  public onCommitmentTransactionCreated(jsonData: any) {}

  /**
   * MsgType_ClientSign_CommitmentTx_AliceSignC2a_360
   * @param recipient_node_peer_id string
   * @param recipient_user_peer_id string
   * @param info      SignedInfo100360
   * @param callback  Function
   */
  public sendSignedHex100360(
    recipient_node_peer_id: string,
    recipient_user_peer_id: string,
    info: SignedInfo100360,
    callback: Function
  ) {
    if (this.isNotString(recipient_node_peer_id)) {
      return callback(this.failure("error recipient_node_peer_id"));
    }

    if (this.isNotString(recipient_user_peer_id)) {
      return callback(this.failure("error recipient_user_peer_id"));
    }

    if (this.isNotString(info.channel_id)) {
      return callback(this.failure("empty channel_id"));
    }

    let msg = new Message();
    msg.type = this.messageType.MsgType_ClientSign_CommitmentTx_AliceSignC2a_360;
    msg.recipient_user_peer_id = recipient_user_peer_id;
    msg.recipient_node_peer_id = recipient_node_peer_id;
    msg.data = info;
    this.sendData(msg, callback);
  }

  /**
   * MsgType_CommitmentTxSigned_SendRevokeAndAcknowledgeCommitmentTransaction_352
   * @param recipient_node_peer_id string
   * @param recipient_user_peer_id string
   * @param info CommitmentTxSigned
   * @param callback function
   */
  public commitmentTransactionAccepted(
    recipient_node_peer_id: string,
    recipient_user_peer_id: string,
    info: CommitmentTxSigned,
    callback: Function
  ) {
    if (this.isNotString(recipient_node_peer_id)) {
      return callback(this.failure("error recipient_node_peer_id"));
    }

    if (this.isNotString(recipient_user_peer_id)) {
      return callback(this.failure("error recipient_user_peer_id"));
    }

    if (this.isNotString(info.channel_id)) {
      return callback(this.failure("empty channel_id"));
    }

    if (this.isNotString(info.msg_hash)) {
      return callback(this.failure("empty msg_hash"));
    }

    if (info.approval == null) {
      info.approval = false;
    }
    if (info.approval == true) {
      if (this.isNotString(info.curr_temp_address_pub_key)) {
        return callback(this.failure("empty curr_temp_address_pub_key"));
      }
    }

    let msg = new Message();
    msg.type = this.messageType.MsgType_CommitmentTxSigned_SendRevokeAndAcknowledgeCommitmentTransaction_352;
    msg.recipient_user_peer_id = recipient_user_peer_id;
    msg.recipient_node_peer_id = recipient_node_peer_id;
    msg.data = info;
    this.sendData(msg, callback);
  }

  public onCommitmentTransactionAccepted(jsonData: any) {}

  /**
   * MsgType_ClientSign_CommitmentTx_BobSignC2b_361
   * @param recipient_node_peer_id string
   * @param recipient_user_peer_id string
   * @param info      SignedInfo100361
   * @param callback  Function
   */
  public sendSignedHex100361(
    recipient_node_peer_id: string,
    recipient_user_peer_id: string,
    info: SignedInfo100361,
    callback: Function
  ) {
    if (this.isNotString(recipient_node_peer_id)) {
      return callback(this.failure("error recipient_node_peer_id"));
    }

    if (this.isNotString(recipient_user_peer_id)) {
      return callback(this.failure("error recipient_user_peer_id"));
    }

    if (this.isNotString(info.channel_id)) {
      return callback(this.failure("empty channel_id"));
    }

    let msg = new Message();
    msg.type = this.messageType.MsgType_ClientSign_CommitmentTx_BobSignC2b_361;
    msg.recipient_user_peer_id = recipient_user_peer_id;
    msg.recipient_node_peer_id = recipient_node_peer_id;
    msg.data = info;
    this.sendData(msg, callback);
  }

  /**
   * MsgType_ClientSign_CommitmentTx_AliceSignC2b_362
   * @param recipient_node_peer_id string
   * @param recipient_user_peer_id string
   * @param info      SignedInfo100362
   * @param callback  Function
   */
  public sendSignedHex100362(
    recipient_node_peer_id: string,
    recipient_user_peer_id: string,
    info: SignedInfo100362,
    callback: Function
  ) {
    if (this.isNotString(recipient_node_peer_id)) {
      return callback(this.failure("error recipient_node_peer_id"));
    }

    if (this.isNotString(recipient_user_peer_id)) {
      return callback(this.failure("error recipient_user_peer_id"));
    }

    if (this.isNotString(info.channel_id)) {
      return callback(this.failure("empty channel_id"));
    }

    let msg = new Message();
    msg.type = this.messageType.MsgType_ClientSign_CommitmentTx_AliceSignC2b_362;
    msg.recipient_user_peer_id = recipient_user_peer_id;
    msg.recipient_node_peer_id = recipient_node_peer_id;
    msg.data = info;
    this.sendData(msg, callback);
  }

  /**
   * MsgType_ClientSign_CommitmentTx_AliceSignC2b_Rd_363
   * @param recipient_node_peer_id string
   * @param recipient_user_peer_id string
   * @param info      SignedInfo100363
   * @param callback  Function
   */
  public sendSignedHex100363(
    recipient_node_peer_id: string,
    recipient_user_peer_id: string,
    info: SignedInfo100363,
    callback: Function
  ) {
    if (this.isNotString(recipient_node_peer_id)) {
      return callback(this.failure("error recipient_node_peer_id"));
    }

    if (this.isNotString(recipient_user_peer_id)) {
      return callback(this.failure("error recipient_user_peer_id"));
    }

    if (this.isNotString(info.channel_id)) {
      return callback(this.failure("empty channel_id"));
    }

    let msg = new Message();
    msg.type = this.messageType.MsgType_ClientSign_CommitmentTx_AliceSignC2b_Rd_363;
    msg.recipient_user_peer_id = recipient_user_peer_id;
    msg.recipient_node_peer_id = recipient_node_peer_id;
    msg.data = info;
    this.sendData(msg, callback);
  }

  /**
   * MsgType_ClientSign_CommitmentTx_BobSignC2b_Rd_364
   * @param info      SignedInfo100364
   * @param callback  Function
   */
  public sendSignedHex100364(info: SignedInfo100364, callback: Function) {
    if (this.isNotString(info.channel_id)) {
      return callback(this.failure("empty channel_id"));
    }

    let msg = new Message();
    msg.type = this.messageType.MsgType_ClientSign_CommitmentTx_BobSignC2b_Rd_364;
    msg.data = info;
    this.sendData(msg, callback);
  }

  /**
   * MsgType_HTLC_Invoice_402
   * @param info InvoiceInfo
   * @param callback function
   */
  public addInvoice(info: InvoiceInfo, callback: Function) {
    if (info.property_id == null || info.property_id <= 0) {
      return callback(this.failure("empty property_id"));
    }

    if (info.amount == null || info.amount <= 0) {
      return callback(this.failure("wrong amount"));
    }

    if (this.isNotString(info.h)) {
      return callback(this.failure("empty h"));
    }

    if (this.isNotString(info.expiry_time)) {
      return callback(this.failure("empty expiry_time"));
    }

    let msg = new Message();
    msg.type = this.messageType.MsgType_HTLC_Invoice_402;
    msg.data = info;
    this.sendData(msg, callback);
  }

  public onAddInvoice(jsonData: any) {}

  /**
   * MsgType_HTLC_FindPath_401
   * @param info HTLCFindPathInfo
   * @param callback function
   */
  public HTLCFindPath(info: HTLCFindPathInfo, callback: Function) {
    if (this.isNotString(info.invoice)) {
      return callback(this.failure(`error invoice:\n\n ${info}`));
    }
    let msg = new Message();
    msg.type = this.messageType.MsgType_HTLC_FindPath_401;
    msg.data = info;
    this.sendData(msg, callback);
  }

  public onHTLCFindPath(jsonData: any) {}

  /**
   * MsgType_HTLC_SendAddHTLC_40
   * @param recipient_node_peer_id string
   * @param recipient_user_peer_id string
   * @param info addHTLCInfo
   * @param callback function
   */
  public addHTLC(
    recipient_node_peer_id: string,
    recipient_user_peer_id: string,
    info: addHTLCInfo,
    callback: Function
  ) {
    if (this.isNotString(recipient_node_peer_id)) {
      return callback(this.failure("error recipient_node_peer_id"));
    }

    if (this.isNotString(recipient_user_peer_id)) {
      return callback(this.failure("error recipient_user_peer_id"));
    }

    if (this.isNotString(info.h)) {
      return callback(this.failure("empty h"));
    }
    if (info.property_id <= 0) {
      return callback(this.failure("wrong property_id"));
    }
    if (info.amount <= 0) {
      return callback(this.failure("wrong amount"));
    }
    if (this.isNotString(info.memo)) {
      info.memo = "";
    }
    if (this.isNotString(info.routing_packet)) {
      return callback(this.failure("empty routing_packet"));
    }
    if (info.cltv_expiry <= 0) {
      return callback(this.failure("wrong cltv_expiry"));
    }
    if (this.isNotString(info.last_temp_address_private_key)) {
      return callback(this.failure("empty last_temp_address_private_key"));
    }
    if (this.isNotString(info.curr_rsmc_temp_address_pub_key)) {
      return callback(this.failure("empty curr_rsmc_temp_address_pub_key"));
    }
    if (this.isNotString(info.curr_htlc_temp_address_pub_key)) {
      return callback(this.failure("empty curr_htlc_temp_address_pub_key"));
    }
    if (this.isNotString(info.curr_htlc_temp_address_for_ht1a_pub_key)) {
      return callback(
        this.failure("empty curr_htlc_temp_address_for_ht1a_pub_key")
      );
    }

    let msg = new Message();
    msg.type = this.messageType.MsgType_HTLC_SendAddHTLC_40;
    msg.data = info;
    msg.recipient_user_peer_id = recipient_user_peer_id;
    msg.recipient_node_peer_id = recipient_node_peer_id;
    this.sendData(msg, callback);
  }

  public onAddHTLC(jsonData: any) {}

  /**
   * MsgType_HTLC_ClientSign_Alice_C3a_100
   * @param recipient_node_peer_id string
   * @param recipient_user_peer_id string
   * @param info  SignedInfo100100
   * @param callback  Function
   */
  public sendSignedHex100100(
    recipient_node_peer_id: string,
    recipient_user_peer_id: string,
    info: SignedInfo100100,
    callback: Function
  ) {
    if (this.isNotString(recipient_node_peer_id)) {
      return callback(this.failure("error recipient_node_peer_id"));
    }

    if (this.isNotString(recipient_user_peer_id)) {
      return callback(this.failure("error recipient_user_peer_id"));
    }

    if (this.isNotString(info.channel_id)) {
      return callback(this.failure("empty channel_id"));
    }

    let msg = new Message();
    msg.type = this.messageType.MsgType_HTLC_ClientSign_Alice_C3a_100;
    msg.recipient_user_peer_id = recipient_user_peer_id;
    msg.recipient_node_peer_id = recipient_node_peer_id;
    msg.data = info;
    this.sendData(msg, callback);
  }

  /**
   * MsgType_HTLC_ClientSign_Bob_C3b_101
   * @param recipient_node_peer_id string
   * @param recipient_user_peer_id string
   * @param info  SignedInfo100101
   * @param callback  Function
   */
  public sendSignedHex100101(
    recipient_node_peer_id: string,
    recipient_user_peer_id: string,
    info: SignedInfo100101,
    callback: Function
  ) {
    if (this.isNotString(recipient_node_peer_id)) {
      return callback(this.failure("error recipient_node_peer_id"));
    }

    if (this.isNotString(recipient_user_peer_id)) {
      return callback(this.failure("error recipient_user_peer_id"));
    }

    if (this.isNotString(info.channel_id)) {
      return callback(this.failure("empty channel_id"));
    }

    let msg = new Message();
    msg.type = this.messageType.MsgType_HTLC_ClientSign_Bob_C3b_101;
    msg.recipient_user_peer_id = recipient_user_peer_id;
    msg.recipient_node_peer_id = recipient_node_peer_id;
    msg.data = info;
    this.sendData(msg, callback);
  }

  /**
   * MsgType_HTLC_ClientSign_Alice_C3b_102
   * @param info  SignedInfo100102
   * @param callback  Function
   */
  public sendSignedHex100102(info: SignedInfo100102, callback: Function) {
    if (this.isNotString(info.channel_id)) {
      return callback(this.failure("empty channel_id"));
    }

    let msg = new Message();
    msg.type = this.messageType.MsgType_HTLC_ClientSign_Alice_C3b_102;
    msg.data = info;
    this.sendData(msg, callback);
  }

  /**
   * MsgType_HTLC_ClientSign_Alice_C3bSub_103
   * @param recipient_node_peer_id string
   * @param recipient_user_peer_id string
   * @param info  SignedInfo100103
   * @param callback  Function
   */
  public sendSignedHex100103(
    recipient_node_peer_id: string,
    recipient_user_peer_id: string,
    info: SignedInfo100103,
    callback: Function
  ) {
    if (this.isNotString(recipient_node_peer_id)) {
      return callback(this.failure("error recipient_node_peer_id"));
    }

    if (this.isNotString(recipient_user_peer_id)) {
      return callback(this.failure("error recipient_user_peer_id"));
    }

    if (this.isNotString(info.channel_id)) {
      return callback(this.failure("empty channel_id"));
    }

    let msg = new Message();
    msg.type = this.messageType.MsgType_HTLC_ClientSign_Alice_C3bSub_103;
    msg.recipient_user_peer_id = recipient_user_peer_id;
    msg.recipient_node_peer_id = recipient_node_peer_id;
    msg.data = info;
    this.sendData(msg, callback);
  }

  /**
   * MsgType_HTLC_ClientSign_Bob_C3bSub_104
   * @param info  SignedInfo100104
   * @param callback  Function
   */
  public sendSignedHex100104(info: SignedInfo100104, callback: Function) {
    if (this.isNotString(info.channel_id)) {
      return callback(this.failure("empty channel_id"));
    }

    if (this.isNotString(info.curr_htlc_temp_address_for_he_pub_key)) {
      return callback(
        this.failure("empty curr_htlc_temp_address_for_he_pub_key")
      );
    }

    let msg = new Message();
    msg.type = this.messageType.MsgType_HTLC_ClientSign_Bob_C3bSub_104;
    msg.data = info;
    this.sendData(msg, callback);
  }

  /**
   * MsgType_HTLC_ClientSign_Alice_He_105
   * @param recipient_node_peer_id string
   * @param recipient_user_peer_id string
   * @param info  SignedInfo100105
   * @param callback  Function
   */
  public sendSignedHex100105(
    recipient_node_peer_id: string,
    recipient_user_peer_id: string,
    info: SignedInfo100105,
    callback: Function
  ) {
    if (this.isNotString(recipient_node_peer_id)) {
      return callback(this.failure("error recipient_node_peer_id"));
    }

    if (this.isNotString(recipient_user_peer_id)) {
      return callback(this.failure("error recipient_user_peer_id"));
    }

    if (this.isNotString(info.channel_id)) {
      return callback(this.failure("empty channel_id"));
    }

    let msg = new Message();
    msg.type = this.messageType.MsgType_HTLC_ClientSign_Alice_He_105;
    msg.recipient_user_peer_id = recipient_user_peer_id;
    msg.recipient_node_peer_id = recipient_node_peer_id;
    msg.data = info;
    this.sendData(msg, callback);
  }

  /**
   * MsgType_HTLC_ClientSign_Bob_HeSub_106
   * @param recipient_node_peer_id string
   * @param recipient_user_peer_id string
   * @param info  SignedInfo100106
   * @param callback  Function
   */
  public sendSignedHex100106(
    recipient_node_peer_id: string,
    recipient_user_peer_id: string,
    info: SignedInfo100106,
    callback: Function
  ) {
    if (this.isNotString(recipient_node_peer_id)) {
      return callback(this.failure("error recipient_node_peer_id"));
    }

    if (this.isNotString(recipient_user_peer_id)) {
      return callback(this.failure("error recipient_user_peer_id"));
    }

    if (this.isNotString(info.channel_id)) {
      return callback(this.failure("empty channel_id"));
    }

    let msg = new Message();
    msg.type = this.messageType.MsgType_HTLC_ClientSign_Bob_HeSub_106;
    msg.recipient_user_peer_id = recipient_user_peer_id;
    msg.recipient_node_peer_id = recipient_node_peer_id;
    msg.data = info;
    this.sendData(msg, callback);
  }

  /**
   * MsgType_HTLC_Close_ClientSign_Alice_C4a_110
   * @param recipient_node_peer_id string
   * @param recipient_user_peer_id string
   * @param info  SignedInfo100110
   * @param callback  Function
   */
  public sendSignedHex100110(
    recipient_node_peer_id: string,
    recipient_user_peer_id: string,
    info: SignedInfo100110,
    callback: Function
  ) {
    if (this.isNotString(recipient_node_peer_id)) {
      return callback(this.failure("error recipient_node_peer_id"));
    }

    if (this.isNotString(recipient_user_peer_id)) {
      return callback(this.failure("error recipient_user_peer_id"));
    }

    if (this.isNotString(info.channel_id)) {
      return callback(this.failure("empty channel_id"));
    }

    let msg = new Message();
    msg.type = this.messageType.MsgType_HTLC_Close_ClientSign_Alice_C4a_110;
    msg.recipient_user_peer_id = recipient_user_peer_id;
    msg.recipient_node_peer_id = recipient_node_peer_id;
    msg.data = info;
    this.sendData(msg, callback);
  }

  /**
   * MsgType_HTLC_Close_ClientSign_Bob_C4b_111
   * @param recipient_node_peer_id string
   * @param recipient_user_peer_id string
   * @param info  SignedInfo100111
   * @param callback  Function
   */
  public sendSignedHex100111(
    recipient_node_peer_id: string,
    recipient_user_peer_id: string,
    info: SignedInfo100111,
    callback: Function
  ) {
    if (this.isNotString(recipient_node_peer_id)) {
      return callback(this.failure("error recipient_node_peer_id"));
    }

    if (this.isNotString(recipient_user_peer_id)) {
      return callback(this.failure("error recipient_user_peer_id"));
    }

    if (this.isNotString(info.channel_id)) {
      return callback(this.failure("empty channel_id"));
    }

    let msg = new Message();
    msg.type = this.messageType.MsgType_HTLC_Close_ClientSign_Bob_C4b_111;
    msg.recipient_user_peer_id = recipient_user_peer_id;
    msg.recipient_node_peer_id = recipient_node_peer_id;
    msg.data = info;
    this.sendData(msg, callback);
  }

  /**
   * MsgType_HTLC_Close_ClientSign_Alice_C4b_112
   * @param info  SignedInfo100112
   * @param callback  Function
   */
  public sendSignedHex100112(info: SignedInfo100112, callback: Function) {
    if (this.isNotString(info.channel_id)) {
      return callback(this.failure("empty channel_id"));
    }

    let msg = new Message();
    msg.type = this.messageType.MsgType_HTLC_Close_ClientSign_Alice_C4b_112;
    msg.data = info;
    this.sendData(msg, callback);
  }

  /**
   * MsgType_HTLC_Close_ClientSign_Alice_C4bSub_113
   * @param recipient_node_peer_id string
   * @param recipient_user_peer_id string
   * @param info  SignedInfo100113
   * @param callback  Function
   */
  public sendSignedHex100113(
    recipient_node_peer_id: string,
    recipient_user_peer_id: string,
    info: SignedInfo100113,
    callback: Function
  ) {
    if (this.isNotString(recipient_node_peer_id)) {
      return callback(this.failure("error recipient_node_peer_id"));
    }

    if (this.isNotString(recipient_user_peer_id)) {
      return callback(this.failure("error recipient_user_peer_id"));
    }

    if (this.isNotString(info.channel_id)) {
      return callback(this.failure("empty channel_id"));
    }

    let msg = new Message();
    msg.type = this.messageType.MsgType_HTLC_Close_ClientSign_Alice_C4bSub_113;
    msg.recipient_user_peer_id = recipient_user_peer_id;
    msg.recipient_node_peer_id = recipient_node_peer_id;
    msg.data = info;
    this.sendData(msg, callback);
  }

  /**
   * MsgType_HTLC_Close_ClientSign_Bob_C4bSubResult_114
   * @param info  SignedInfo100114
   * @param callback  Function
   */
  public sendSignedHex100114(info: SignedInfo100114, callback: Function) {
    if (this.isNotString(info.channel_id)) {
      return callback(this.failure("empty channel_id"));
    }

    let msg = new Message();
    msg.type = this.messageType.MsgType_HTLC_Close_ClientSign_Bob_C4bSubResult_114;
    msg.data = info;
    this.sendData(msg, callback);
  }

  /**
   * MsgType_HTLC_SendAddHTLCSigned_41
   * @param recipient_node_peer_id string
   * @param recipient_user_peer_id string
   * @param info HtlcSignedInfo
   * @param callback function
   */
  public htlcSigned(
    recipient_node_peer_id: string,
    recipient_user_peer_id: string,
    info: HtlcSignedInfo,
    callback: Function
  ) {
    if (this.isNotString(recipient_node_peer_id)) {
      return callback(this.failure("error recipient_node_peer_id"));
    }
    if (this.isNotString(recipient_user_peer_id)) {
      return callback(this.failure("error recipient_user_peer_id"));
    }
    if (this.isNotString(info.payer_commitment_tx_hash)) {
      return callback(this.failure("empty payer_commitment_tx_hash"));
    }
    if (this.isNotString(info.curr_rsmc_temp_address_pub_key)) {
      return callback(this.failure("empty curr_rsmc_temp_address_pub_key"));
    }
    if (this.isNotString(info.curr_htlc_temp_address_pub_key)) {
      return callback(this.failure("empty curr_htlc_temp_address_pub_key"));
    }

    let msg = new Message();
    msg.type = this.messageType.MsgType_HTLC_SendAddHTLCSigned_41;
    msg.data = info;
    msg.recipient_user_peer_id = recipient_user_peer_id;
    msg.recipient_node_peer_id = recipient_node_peer_id;
    this.sendData(msg, callback);
  }

  public onHtlcSigned(jsonData: any) {}

  /* ***************** backward R begin*****************/
  /**
   * MsgType_HTLC_SendVerifyR_45
   * @param recipient_node_peer_id string
   * @param recipient_user_peer_id string
   * @param info ForwardRInfo
   * @param callback function
   */
  public forwardR(
    recipient_node_peer_id: string,
    recipient_user_peer_id: string,
    info: ForwardRInfo,
    callback: Function
  ) {
    if (this.isNotString(recipient_node_peer_id)) {
      return callback(this.failure("error recipient_node_peer_id"));
    }
    if (this.isNotString(recipient_user_peer_id)) {
      return callback(this.failure("error recipient_user_peer_id"));
    }
    if (this.isNotString(info.channel_id)) {
      return callback(this.failure("empty channel_id"));
    }

    if (this.isNotString(info.r)) {
      return callback(this.failure("empty r"));
    }

    let msg = new Message();
    msg.type = this.messageType.MsgType_HTLC_SendVerifyR_45;
    msg.data = info;
    msg.recipient_user_peer_id = recipient_user_peer_id;
    msg.recipient_node_peer_id = recipient_node_peer_id;
    this.sendData(msg, callback);
  }

  public onForwardR(jsonData: any) {}

  /**
   * MsgType_HTLC_SendSignVerifyR_46
   * @param recipient_node_peer_id string
   * @param recipient_user_peer_id string
   * @param info SignRInfo
   * @param callback function
   */
  public signR(
    recipient_node_peer_id: string,
    recipient_user_peer_id: string,
    info: SignRInfo,
    callback: Function
  ) {
    if (this.isNotString(recipient_node_peer_id)) {
      return callback(this.failure("error recipient_node_peer_id"));
    }
    if (this.isNotString(recipient_user_peer_id)) {
      return callback(this.failure("error recipient_user_peer_id"));
    }
    if (this.isNotString(info.channel_id)) {
      return callback(this.failure("empty channel_id"));
    }

    let msg = new Message();
    msg.type = this.messageType.MsgType_HTLC_SendSignVerifyR_46;
    msg.data = info;
    msg.recipient_user_peer_id = recipient_user_peer_id;
    msg.recipient_node_peer_id = recipient_node_peer_id;
    this.sendData(msg, callback);
  }

  public onSignR(jsonData: any) {}

  /* ***************** backward R end*****************/

  /* ***************** close htlc tx begin*****************/
  /**
   * MsgType_HTLC_SendRequestCloseCurrTx_49
   * @param recipient_node_peer_id string
   * @param recipient_user_peer_id string
   * @param info CloseHtlcTxInfo
   * @param callback function
   * */
  public closeHTLC(
    recipient_node_peer_id: string,
    recipient_user_peer_id: string,
    info: CloseHtlcTxInfo,
    callback: Function
  ) {
    if (this.isNotString(recipient_node_peer_id)) {
      return callback(this.failure("error recipient_node_peer_id"));
    }
    if (this.isNotString(recipient_user_peer_id)) {
      return callback(this.failure("error recipient_user_peer_id"));
    }
    if (this.isNotString(info.channel_id)) {
      return callback(this.failure("empty channel_id"));
    }

    if (this.isNotString(info.last_rsmc_temp_address_private_key)) {
      return callback(this.failure("empty last_rsmc_temp_address_private_key"));
    }
    if (this.isNotString(info.last_htlc_temp_address_private_key)) {
      return callback(this.failure("empty last_htlc_temp_address_private_key"));
    }
    if (this.isNotString(info.last_htlc_temp_address_for_htnx_private_key)) {
      return callback(this.failure("empty last_htlc_temp_address_private_key"));
    }
    if (this.isNotString(info.curr_temp_address_pub_key)) {
      return callback(this.failure("empty curr_rsmc_temp_address_pub_key"));
    }

    let msg = new Message();
    msg.type = this.messageType.MsgType_HTLC_SendRequestCloseCurrTx_49;
    msg.data = info;
    msg.recipient_user_peer_id = recipient_user_peer_id;
    msg.recipient_node_peer_id = recipient_node_peer_id;
    this.sendData(msg, callback);
  }

  public onCloseHTLC(jsonData: any) {}

  /**
   * MsgType_HTLC_SendCloseSigned_50
   * @param recipient_node_peer_id string
   * @param recipient_user_peer_id string
   * @param info CloseHtlcTxInfoSigned
   * @param callback function
   */
  public closeHTLCSigned(
    recipient_node_peer_id: string,
    recipient_user_peer_id: string,
    info: CloseHtlcTxInfoSigned,
    callback: Function
  ) {
    if (this.isNotString(recipient_node_peer_id)) {
      return callback(this.failure("error recipient_node_peer_id"));
    }
    if (this.isNotString(recipient_user_peer_id)) {
      return callback(this.failure("error recipient_user_peer_id"));
    }

    if (this.isNotString(info.msg_hash)) {
      return callback(this.failure("empty msg_hash"));
    }
    if (this.isNotString(info.last_rsmc_temp_address_private_key)) {
      return callback(this.failure("empty last_rsmc_temp_address_private_key"));
    }
    if (this.isNotString(info.last_htlc_temp_address_private_key)) {
      return callback(this.failure("empty last_htlc_temp_address_private_key"));
    }
    if (this.isNotString(info.last_htlc_temp_address_for_htnx_private_key)) {
      return callback(
        this.failure("empty last_htlc_temp_address_for_htnx_private_key")
      );
    }
    if (this.isNotString(info.curr_temp_address_pub_key)) {
      return callback(this.failure("empty curr_rsmc_temp_address_pub_key"));
    }

    let msg = new Message();
    msg.type = this.messageType.MsgType_HTLC_SendCloseSigned_50;
    msg.recipient_user_peer_id = recipient_user_peer_id;
    msg.recipient_node_peer_id = recipient_node_peer_id;
    msg.data = info;
    this.sendData(msg, callback);
  }

  public onCloseHTLCSigned(jsonData: any) {}

  /* ***************** close htlc tx end*****************/

  /* ********************* query data *************************** */
  /**
   * MsgType_Core_Omni_GetTransaction_2118
   * @param txid string
   * @param callback function
   */
  public getTransaction(txid: string, callback: Function) {
    if (this.isNotString(txid)) {
      return callback(this.failure("empty txid"));
    }
    let msg = new Message();
    msg.type = this.messageType.MsgType_Core_Omni_GetTransaction_2118;
    msg.data["txid"] = txid;
    this.sendData(msg, callback);
  }

  public onGetTransaction(jsonData: any) {}

  /**
   * MsgType_Core_Omni_CreateNewTokenFixed_2113
   * @param info IssueFixedAmountInfo
   * @param callback function
   */
  public issueFixedAmount(info: IssueFixedAmountInfo, callback: Function) {
    if (this.isNotString(info.from_address)) {
      return callback(this.failure("empty from_address"));
    }
    if (this.isNotString(info.name)) {
      return callback(this.failure("empty name"));
    }
    if (info.ecosystem == null) {
      return callback(this.failure("empty ecosystem"));
    }
    if (info.divisible_type == null) {
      return callback(this.failure("empty divisible_type"));
    }
    if (info.amount == null || info.amount <= 1) {
      return callback(this.failure("wrong amount"));
    }
    if (this.isNotString(info.data)) {
      info.data = "";
    }

    let msg = new Message();
    msg.type = this.messageType.MsgType_Core_Omni_CreateNewTokenFixed_2113;
    msg.data = info;
    this.sendData(msg, callback);
  }

  public onIssueFixedAmount(jsonData: any) {}

  /**
   * MsgType_Core_Omni_CreateNewTokenManaged_2114
   * @param info IssueManagedAmoutInfo
   * @param callback function
   */
  public issueManagedAmout(info: IssueManagedAmoutInfo, callback: Function) {
    if (this.isNotString(info.from_address)) {
      return callback(this.failure("empty from_address"));
    }
    if (this.isNotString(info.name)) {
      return callback(this.failure("empty name"));
    }
    if (info.ecosystem == null) {
      return callback(this.failure("empty ecosystem"));
    }
    if (info.divisible_type == null) {
      return callback(this.failure("empty divisible_type"));
    }
    if (this.isNotString(info.data)) {
      info.data = "";
    }
    let msg = new Message();
    msg.type = this.messageType.MsgType_Core_Omni_CreateNewTokenManaged_2114;
    msg.data = info;
    this.sendData(msg, callback);
  }

  public onIssueManagedAmout(jsonData: any) {}

  /**
   * MsgType_Core_Omni_GrantNewUnitsOfManagedToken_2115
   * @param info OmniSendGrant
   * @param callback function
   */
  public sendGrant(info: OmniSendGrant, callback: Function) {
    if (this.isNotString(info.from_address)) {
      return callback(this.failure("empty from_address"));
    }
    if (info.property_id == null || info.property_id < 1) {
      return callback(this.failure("empty property_id"));
    }
    if (info.amount == null || info.amount <= 0) {
      return callback(this.failure("wrong amount"));
    }
    if (this.isNotString(info.memo)) {
      info.memo = "";
    }

    let msg = new Message();
    msg.type = this.messageType.MsgType_Core_Omni_GrantNewUnitsOfManagedToken_2115;
    msg.data = info;
    this.sendData(msg, callback);
  }

  public onSendGrant(jsonData: any) {}

  /**
   * MsgType_Core_Omni_RevokeUnitsOfManagedToken_2116
   * @param info OmniSendRevoke
   * @param callback function
   */
  public sendRevoke(info: OmniSendRevoke, callback: Function) {
    if (this.isNotString(info.from_address)) {
      return callback(this.failure("empty from_address"));
    }
    if (info.property_id == null || info.property_id < 1) {
      return callback(this.failure("empty property_id"));
    }
    if (info.amount == null || info.amount <= 0) {
      return callback(this.failure("wrong amount"));
    }
    if (this.isNotString(info.memo)) {
      info.memo = "";
    }
    let msg = new Message();
    msg.type = this.messageType.MsgType_Core_Omni_RevokeUnitsOfManagedToken_2116;
    msg.data = info;
    this.sendData(msg, callback);
  }

  public onSendRevoke(jsonData: any) {}

  /**
   * MsgType_Core_Omni_Getbalance_2112
   * @param address string
   * @param callback function
   */
  public getAllBalancesForAddress(address: string, callback: Function) {
    if (this.isNotString(address)) {
      return callback(this.failure("empty address"));
    }
    let msg = new Message();
    msg.type = this.messageType.MsgType_Core_Omni_Getbalance_2112;
    msg.data["address"] = address;
    this.sendData(msg, callback);
  }

  public onGetAllBalancesForAddress(jsonData: any) {}

  /**
   * MsgType_Core_Omni_GetProperty_2119
   * @param propertyId string
   * @param callback function
   */
  public getProperty(propertyId: string, callback: Function) {
    if (this.isNotString(propertyId)) {
      return callback(this.failure("empty propertyId"));
    }
    let msg = new Message();
    msg.type = this.messageType.MsgType_Core_Omni_GetProperty_2119;
    msg.data["propertyId"] = propertyId;
    this.sendData(msg, callback);
  }

  public onGetProperty(jsonData: any) {}

  /**
   * MsgType_Core_BalanceByAddress_2108
   * @param address string
   * @param callback function
   */
  public getBtcBalanceByAddress(address: string, callback: Function) {
    if (this.isNotString(address)) {
      return callback(this.failure("empty address"));
    }
    let msg = new Message();
    msg.type = this.messageType.MsgType_Core_BalanceByAddress_2108;
    msg.data["address"] = address;
    this.sendData(msg, callback);
  }

  public onGetBtcBalanceByAddress(jsonData: any) {}

  /**
   * MsgType_Core_Btc_ImportPrivKey_2111
   * @param privkey string
   * @param callback function
   */
  public importPrivKey(privkey: string, callback: Function) {
    if (this.isNotString(privkey)) {
      return callback(this.failure("empty privkey"));
    }
    let msg = new Message();
    msg.type = this.messageType.MsgType_Core_Btc_ImportPrivKey_2111;
    msg.data["privkey"] = privkey;
    this.sendData(msg, callback);
  }

  public onImportPrivKey(jsonData: any) {}

  /**
   * MsgType_HTLC_CreatedRAndHInfoList_N4001
   * @param callback function
   */
  public getAddHTLCRandHInfoList(callback: Function) {
    let msg = new Message();
    // msg.type = this.messageType.MsgType_HTLC_CreatedRAndHInfoList_N4001;
    this.sendData(msg, callback);
  }

  public onGetAddHTLCRandHInfoList(jsonData: any) {}

  /**
   * MsgType_HTLC_SignedRAndHInfoList_N4101
   * @param callback function
   */
  public getHtlcSignedRandHInfoList(callback: Function) {
    let msg = new Message();
    // msg.type = this.messageType.MsgType_HTLC_SignedRAndHInfoList_N4101;
    this.sendData(msg, callback);
  }

  public onGetHtlcSignedRandHInfoList(jsonData: any) {}

  /**
   * MsgType_HTLC_GetRFromLCommitTx_N4103
   * @param channel_id string
   * @param callback function
   */
  public getRFromCommitmentTx(channel_id: string, callback: Function) {
    if (this.isNotString(channel_id)) {
      return callback(this.failure("empty channel_id"));
    }
    let msg = new Message();
    // msg.type = this.messageType.MsgType_HTLC_GetRFromLCommitTx_N4103;
    msg.data["channel_id"] = channel_id;
    this.sendData(msg, callback);
  }

  public onGetRFromCommitmentTx(jsonData: any) {}

  /**
   * MsgType_HTLC_GetPathInfoByH_N4104
   * @param h string
   * @param callback function
   */
  public getPathInfoByH(h: string, callback: Function) {
    if (this.isNotString(h)) {
      return callback(this.failure("empty h"));
    }
    let msg = new Message();
    // msg.type = this.messageType.MsgType_HTLC_GetPathInfoByH_N4104;
    msg.data = h;
    this.sendData(msg, callback);
  }

  public onGetPathInfoByH(jsonData: any) {}

  /**
   * MsgType_HTLC_GetRInfoByHOfOwner_N4105
   * @param h string
   * @param callback function
   */
  public getRByHOfReceiver(h: string, callback: Function) {
    if (this.isNotString(h)) {
      return callback(this.failure("empty h"));
    }
    let msg = new Message();
    // msg.type = this.messageType.MsgType_HTLC_GetRInfoByHOfOwner_N4105;
    msg.data = h;
    this.sendData(msg, callback);
  }

  public onGetRByHOfReceiver(jsonData: any) {}

  /**
   * MsgType_CommitmentTx_LatestCommitmentTxByChanId_3203
   * @param channel_id string
   * @param callback function
   */
  public getLatestCommitmentTransaction(
    channel_id: string,
    callback: Function
  ) {
    if (this.isNotString(channel_id)) {
      return callback(this.failure("empty channel_id"));
    }
    let msg = new Message();
    msg.type = this.messageType.MsgType_CommitmentTx_LatestCommitmentTxByChanId_3203;
    msg.data["channel_id"] = channel_id;
    this.sendData(msg, callback);
  }

  public onGetLatestCommitmentTransaction(jsonData: any) {}

  /**
   * MsgType_CommitmentTx_ItemsByChanId_3200
   * @param channel_id string
   * @param callback function
   */
  public getItemsByChannelId(channel_id: string, callback: Function) {
    if (this.isNotString(channel_id)) {
      return callback(this.failure("empty channel_id"));
    }
    let msg = new Message();
    msg.type = this.messageType.MsgType_CommitmentTx_ItemsByChanId_3200;
    msg.data["channel_id"] = channel_id;
    this.sendData(msg, callback);
  }

  public onGetItemsByChannelId(jsonData: any) {}

  /**
   * MsgType_ChannelOpen_AllItem_3150
   * @param page_size Number
   * @param page_index Number
   * @param callback function
   */
  public getMyChannels(
    page_size: Number,
    page_index: Number,
    callback: Function
  ) {
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
    this.sendData(msg, callback);
  }

  public onGetMyChannels(jsonData: any) {}

  /**
   * MsgType_GetMiniBtcFundAmount_2006
   * @param callback function
   */
  public getAmountOfRechargeBTC(callback: Function) {
    let msg = new Message();
    msg.type = this.messageType.MsgType_GetMiniBtcFundAmount_2006;
    this.sendData(msg, callback);
  }

  public onGetAmountOfRechargeBTC(jsonData: any) {}

  /**
   * MsgType_GetChannelInfoByChannelId_3154
   * @param channel_id string
   * @param callback function
   */
  public getChannelDetailFromChannelID(channel_id: string, callback: Function) {
    if (this.isNotString(channel_id)) {
      return callback(this.failure("empty channel_id"));
    }
    let msg = new Message();
    msg.type = this.messageType.MsgType_GetChannelInfoByChannelId_3154;
    msg.data = channel_id;
    // msg.data["channel_id"] = channel_id;
    this.sendData(msg, callback);
  }

  public onGetChannelDetailFromChannelID(jsonData: any) {}

  /**
   * MsgType_GetChannelInfoByDbId_3155
   * @param id number
   * @param callback function
   */
  public getChannelDetailFromDatabaseID(id: number, callback: Function) {
    if (id == null || id <= 0) {
      return callback(this.failure("error id"));
    }
    let msg = new Message();
    msg.type = this.messageType.MsgType_GetChannelInfoByDbId_3155;
    msg.data = id;
    this.sendData(msg, callback);
  }

  public onGetChannelDetailFromDatabaseID(jsonData: any) {}

  /**
   * MsgType_CommitmentTx_AllBRByChanId_3208
   * @param channel_id string
   * @param callback function
   */
  public getAllBreachRemedyTransactions(
    channel_id: string,
    callback: Function
  ) {
    if (this.isNotString(channel_id)) {
      return callback(this.failure("empty channel_id"));
    }
    let msg = new Message();
    msg.type = this.messageType.MsgType_CommitmentTx_AllBRByChanId_3208;
    msg.data["channel_id"] = channel_id;
    this.sendData(msg, callback);
  }

  public onGetAllBreachRemedyTransactions(jsonData: any) {}

  /**
   * MsgType_CommitmentTx_ItemsByChanId_3200
   * @param channel_id string
   * @param callback function
   */
  public getAllCommitmentTx(channel_id: string, callback: Function) {
    if (this.isNotString(channel_id)) {
      return callback(this.failure("empty channel_id"));
    }
    let msg = new Message();
    msg.type = this.messageType.MsgType_CommitmentTx_ItemsByChanId_3200;
    msg.data["channel_id"] = channel_id;
    this.sendData(msg, callback);
  }

  public onGetAllCommitmentTx(jsonData: any) {}

  /**
   * MsgType_CommitmentTx_LatestRDByChanId_3204
   * @param channel_id string
   * @param callback function
   */
  public getLatestRevockableDeliveryTransaction(
    channel_id: string,
    callback: Function
  ) {
    if (this.isNotString(channel_id)) {
      return callback(this.failure("empty channel_id"));
    }
    let msg = new Message();
    msg.type = this.messageType.MsgType_CommitmentTx_LatestRDByChanId_3204;
    msg.data["channel_id"] = channel_id;
    this.sendData(msg, callback);
  }

  public onGetLatestRevockableDeliveryTransaction(jsonData: any) {}

  /**
   * MsgType_CommitmentTx_LatestBRByChanId_3205
   * @param channel_id string
   * @param callback function
   */
  public getLatestBreachRemedyTransaction(
    channel_id: string,
    callback: Function
  ) {
    if (this.isNotString(channel_id)) {
      return callback(this.failure("empty channel_id"));
    }
    let msg = new Message();
    msg.type = this.messageType.MsgType_CommitmentTx_LatestBRByChanId_3205;
    msg.data["channel_id"] = channel_id;
    this.sendData(msg, callback);
  }

  public onGetLatestBreachRemedyTransaction(jsonData: any) {}

  /**
   * MsgType_CommitmentTx_SendSomeCommitmentById_3206
   * @param id number
   * @param callback function
   */
  public sendSomeCommitmentById(id: number, callback: Function) {
    if (id == null || id < 0) {
      return callback(this.failure("error id"));
    }
    let msg = new Message();
    msg.type = this.messageType.MsgType_CommitmentTx_SendSomeCommitmentById_3206;
    msg.data = id;
    this.sendData(msg, callback);
  }

  public onSendSomeCommitmentById(jsonData: any) {}

  /**
   * MsgType_CommitmentTx_AllRDByChanId_3207
   * @param channel_id string
   * @param callback function
   */
  public getAllRevockableDeliveryTransactions(
    channel_id: string,
    callback: Function
  ) {
    if (this.isNotString(channel_id)) {
      return callback(this.failure("empty channel_id"));
    }
    let msg = new Message();
    msg.type = this.messageType.MsgType_CommitmentTx_AllRDByChanId_3207;
    msg.data["channel_id"] = channel_id;
    this.sendData(msg, callback);
  }

  public onGetAllRevockableDeliveryTransactions(jsonData: any) {}

  /**
   * MsgType_SendCloseChannelRequest_38
   * @param recipient_node_peer_id string
   * @param recipient_user_peer_id string
   * @param channel_id string
   * @param callback function
   */
  public closeChannel(
    recipient_node_peer_id: string,
    recipient_user_peer_id: string,
    channel_id: string,
    callback: Function
  ) {
    if (this.isNotString(recipient_node_peer_id)) {
      return callback(this.failure("error recipient_node_peer_id"));
    }

    if (this.isNotString(recipient_user_peer_id)) {
      return callback(this.failure("error recipient_user_peer_id"));
    }

    if (this.isNotString(channel_id)) {
      return callback(this.failure("empty channel_id"));
    }
    let msg = new Message();
    msg.type = this.messageType.MsgType_SendCloseChannelRequest_38;
    msg.data["channel_id"] = channel_id;
    msg.recipient_user_peer_id = recipient_user_peer_id;
    msg.recipient_node_peer_id = recipient_node_peer_id;
    this.sendData(msg, callback);
  }

  public onCloseChannel(jsonData: any) {}

  /**
   * MsgType_SendCloseChannelSign_39
   * @param recipient_node_peer_id string
   * @param recipient_user_peer_id string
   * @param info CloseChannelSign
   * @param callback function
   */
  public closeChannelSigned(
    recipient_node_peer_id: string,
    recipient_user_peer_id: string,
    info: CloseChannelSign,
    callback: Function
  ) {
    if (this.isNotString(recipient_node_peer_id)) {
      return callback(this.failure("error recipient_node_peer_id"));
    }

    if (this.isNotString(recipient_user_peer_id)) {
      return callback(this.failure("error recipient_user_peer_id"));
    }

    if (this.isNotString(info.channel_id)) {
      return callback(this.failure("empty channel_id"));
    }

    if (info.approval == null) {
      info.approval = false;
    }

    if (info.approval) {
      if (this.isNotString(info.request_close_channel_hash)) {
        return callback(this.failure("empty request_close_channel_hash"));
      }
    }

    let msg = new Message();
    msg.type = this.messageType.MsgType_SendCloseChannelSign_39;
    msg.data = info;
    msg.recipient_user_peer_id = recipient_user_peer_id;
    msg.recipient_node_peer_id = recipient_node_peer_id;
    this.sendData(msg, callback);
  }

  public onCloseChannelSigned(jsonData: any) {}

  /**
   * MsgType_Atomic_SendSwap_80
   * @param recipient_node_peer_id string
   * @param recipient_user_peer_id string
   * @param info AtomicSwapRequest
   * @param callback function
   */
  public atomicSwap(
    recipient_node_peer_id: string,
    recipient_user_peer_id: string,
    info: AtomicSwapRequest,
    callback: Function
  ) {
    if (this.isNotString(recipient_node_peer_id)) {
      return callback(this.failure("error recipient_node_peer_id"));
    }

    if (this.isNotString(recipient_user_peer_id)) {
      return callback(this.failure("error recipient_user_peer_id"));
    }

    if (this.isNotString(info.channel_id_from)) {
      return callback(this.failure("empty channel_id_from"));
    }
    if (this.isNotString(info.channel_id_to)) {
      return callback(this.failure("empty channel_id_to"));
    }
    if (this.isNotString(info.recipient_user_peer_id)) {
      return callback(this.failure("empty recipient_user_peer_id"));
    }
    if (this.isNotString(info.transaction_id)) {
      return callback(this.failure("empty transaction_id"));
    }

    if (info.property_sent <= 0) {
      return callback(this.failure("wrong property_sent"));
    }
    if (info.amount <= 0) {
      return callback(this.failure("wrong amount"));
    }
    if (info.exchange_rate <= 0) {
      return callback(this.failure("wrong exchange_rate"));
    }
    if (info.property_received <= 0) {
      return callback(this.failure("wrong property_received"));
    }

    let msg = new Message();
    msg.type = this.messageType.MsgType_Atomic_SendSwap_80;
    msg.data = info;
    msg.recipient_user_peer_id = recipient_user_peer_id;
    msg.recipient_node_peer_id = recipient_node_peer_id;
    this.sendData(msg, callback);
  }

  /**
   * MsgType_Atomic_SendSwapAccept_81
   * @param recipient_node_peer_id string
   * @param recipient_user_peer_id string
   * @param info AtomicSwapAccepted
   * @param callback function
   */
  public atomicSwapAccepted(
    recipient_node_peer_id: string,
    recipient_user_peer_id: string,
    info: AtomicSwapAccepted,
    callback: Function
  ) {
    if (this.isNotString(recipient_node_peer_id)) {
      return callback(this.failure("error recipient_node_peer_id"));
    }

    if (this.isNotString(recipient_user_peer_id)) {
      return callback(this.failure("error recipient_user_peer_id"));
    }

    if (this.isNotString(info.channel_id_from)) {
      return callback(this.failure("empty channel_id_from"));
    }
    if (this.isNotString(info.channel_id_to)) {
      return callback(this.failure("empty channel_id_to"));
    }
    if (this.isNotString(info.recipient_user_peer_id)) {
      return callback(this.failure("empty recipient_user_peer_id"));
    }
    if (this.isNotString(info.transaction_id)) {
      return callback(this.failure("empty transaction_id"));
    }
    if (this.isNotString(info.target_transaction_id)) {
      return callback(this.failure("empty target_transaction_id"));
    }
    if (info.property_sent <= 0) {
      return callback(this.failure("wrong property_sent"));
    }
    if (info.amount <= 0) {
      return callback(this.failure("wrong amount"));
    }
    if (info.exchange_rate <= 0) {
      return callback(this.failure("wrong exchange_rate"));
    }
    if (info.property_received <= 0) {
      return callback(this.failure("wrong property_received"));
    }

    let msg = new Message();
    msg.type = this.messageType.MsgType_Atomic_SendSwapAccept_81;
    msg.data = info;
    msg.recipient_user_peer_id = recipient_user_peer_id;
    msg.recipient_node_peer_id = recipient_node_peer_id;
    this.sendData(msg, callback);
  }

  private isNotString(str: String): boolean {
    if (str == null) {
      return true;
    }
    return str.trim().length == 0;
  }
}
