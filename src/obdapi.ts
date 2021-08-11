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
	AtomicSwapRequest,
} from './pojo';
import { err, ok, Result } from './result';
import {
	IAcceptChannel,
	IConnect,
	IGetMyChannels,
	ILogin,
	IFundingBitcoin,
	IBitcoinFundingCreated,
	ISendSignedHex100341,
	TOnBitcoinFundingCreated,
	TOnChannelOpenAttempt,
	IBitcoinFundingSigned,
	TOnAssetFundingCreated,
	IAssetFundingSigned,
	TSendSignedHex101035,
	TOnCommitmentTransactionCreated,
	ICommitmentTransactionAcceptedResponse,
	ISendSignedHex100361Response,
	TOnAcceptChannel,
	TOn110353,
	ICommitmentTransactionCreated,
	TOn110352,
	ISendSignedHex100364Response,
	ISendSignedHex100362Response,
	ISendSignedHex100363Response,
	IGetProperty,
	ICloseChannel,
	ISaveData,
	TAvailableNetworks,
	ISendSignedHex101035,
	TOmniboltCheckpoints,
	ISendSignedHex100363,
	ICommitmentTransactionAcceptedCheckpointData,
	IListeners,
} from './types';
import { getNextOmniboltAddress, getPrivateKey, signP2SH } from './utils';
import { channelSigningData, defaultDataShape } from './shapes';

const DEFAULT_URL = '62.234.216.108:60020/wstest';

export default class ObdApi {
	constructor({
		url = DEFAULT_URL, //Omnibolt server to connect to.
		loginPhrase = '', //Mnemonic phrase used to login to the omnibolt server.
		mnemonic = '', //Used to generate keys locally when transferring assets & opening/closing channels.
		data = defaultDataShape, //Will resemble the signingData object in the app to manage channel signing data/state.
		saveData = (): any => null, //Used to update/save the data object.
		listeners = {},
		selectedNetwork = 'bitcoin',
		onOpen = (): any => null,
		onClose = (): any => null,
		onError = (): any => null,
	}: {
		url?: string | undefined;
		loginPhrase?: string;
		mnemonic?: string;
		data?: ISaveData;
		saveData?: (data: ISaveData) => any;
		listeners?: IListeners | {};
		selectedNetwork?: TAvailableNetworks;
		onOpen?: (data: string) => any;
		onError?: (data: any) => any;
		onClose?: (code: number, reason: string) => any;
	}) {
		this.defaultUrl = url;
		this.loginPhrase = loginPhrase;
		this.mnemonic = mnemonic;
		this.data = data;
		this.saveData = saveData;
		this.listeners = listeners;
		this.selectedNetwork = selectedNetwork;
		this.onOpen = onOpen;
		this.onClose = onClose;
		this.onError = onError;
	}
	isConnectedToOBD: boolean = false;
	isLoggedIn: boolean = false;
	messageType: MessageType = new MessageType();
	ws: WebSocket | any;
	defaultUrl: string;
	loginPhrase: string;
	mnemonic: string;
	data: ISaveData;
	saveData: (data: ISaveData) => any;
	listeners: IListeners | {};
	selectedNetwork: TAvailableNetworks;
	globalCallback: Function | undefined;
	callbackMap: Map<number, Function> = new Map<number, Function>();
	onOpen: (data: string) => any;
	onError: (data: any) => any;
	onClose: (code: number, reason: string) => any;
	onMessage: Function | undefined;
	onChannelCloseAttempt: ((data: any) => any) | undefined;
	onChannelClose: Function | undefined;
	loginData = {
		nodeAddress: '',
		nodePeerId: '',
		userPeerId: '',
	};

	connect({
		url,
		data,
		saveData,
		loginPhrase,
		mnemonic,
		listeners,
		selectedNetwork,
		onMessage,
		onChannelCloseAttempt,
		onChannelClose,
		onOpen,
		onError,
		onClose,
		onAddHTLC,
		onForwardR,
		onSignR,
		onCloseHTLC,
	}: {
		url: string | undefined;
		data: ISaveData | undefined;
		saveData: (data: ISaveData) => void;
		loginPhrase: string;
		mnemonic: string;
		listeners: IListeners | undefined;
		selectedNetwork: TAvailableNetworks;
		onMessage: (data: any) => any;
		onChannelCloseAttempt: (data: any) => any;
		onAcceptChannel?: (data: TOnAcceptChannel) => any;
		onChannelClose: (data: any) => any;
		onOpen: (data: string) => any;
		onError: (e: string | object) => any;
		onClose: (code: number, reason: string) => any;
		onAddHTLC: (data: any) => any;
		onForwardR: (data: any) => any;
		onSignR: (data: any) => any;
		onCloseHTLC: (data: any) => any;
	}): Promise<Result<IConnect>> {
		return new Promise((resolve): void => {
			if (this.isConnectedToOBD || url !== this.defaultUrl) {
				//Disconnect from the current node and connect to the new one
				//this.logout();
				if (this.ws) this.disconnect();
			}

			if (!url) {
				this.defaultUrl = DEFAULT_URL;
			} else {
				this.defaultUrl = url;
			}
			this.ws = new WebSocket(`ws://${this.defaultUrl}`);

			this.data = data ? data : defaultDataShape;

			if (saveData) this.saveData = saveData;
			if (loginPhrase) this.loginPhrase = loginPhrase;
			if (mnemonic) this.mnemonic = mnemonic;
			if (listeners) this.listeners = listeners;
			if (selectedNetwork) this.selectedNetwork = selectedNetwork;
			if (onMessage) this.onMessage = onMessage;
			if (onOpen) this.onOpen = onOpen;
			if (onError) this.onError = onError;
			if (onClose) this.onClose = onClose;
			if (onChannelCloseAttempt)
				this.onChannelCloseAttempt = onChannelCloseAttempt;
			if (onChannelClose) this.onChannelClose = onChannelClose;
			if (onAddHTLC) this.onAddHTLC = onAddHTLC;
			if (onForwardR) this.onForwardR = onForwardR;
			if (onSignR) this.onSignR = onSignR;
			if (onCloseHTLC) this.onCloseHTLC = onCloseHTLC;

			this.ws.onopen = (): void => {
				// connection opened
				const msg = `Connected to ${this.defaultUrl}`;
				if (this.onMessage) this.onMessage(msg);
				this.isConnectedToOBD = true;
				this.resumeFromCheckpoints().then();
				this.onOpen(msg);
			};

			this.ws.onmessage = (e): void => {
				// a message was received
				try {
					const jsonData = JSON.parse(e.data);
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
          Your peer is attempting to cooperatively close a channel
           */
					if (jsonData.type == -100038 || jsonData.type == -110038) {
						if (this.onChannelCloseAttempt)
							this.onChannelCloseAttempt(jsonData);
					}

					/*
          A channel open request has been accepted.
          */
					if (jsonData.type == -110033) {
						if (this.onAcceptChannel) this.onAcceptChannel(jsonData);
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

					//-110351
					if (jsonData.type == -110351) {
						//Auto response to acknowledge creation of the commitment transaction.
						if (this.onCommitmentTransactionCreated)
							this.onCommitmentTransactionCreated(jsonData);
					}
					//-110353
					if (jsonData.type == -110353) {
						//Auto response to acknowledge creation of the commitment transaction.
						if (this.on110353) this.on110353(jsonData);
					}
					//-110352
					if (jsonData.type == -110352) {
						//Auto response to acknowledge creation of the commitment transaction.
						if (this.on110352) this.on110352(jsonData);
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
				} catch (error) {
					console.log(error);
					if (this.onMessage) this.onMessage(error);
					resolve(err(error));
				}
			};

			this.ws.onerror = (e): void => {
				// an error occurred
				console.log(e);
				this.disconnect();
				this.onError(e.message);
				resolve(err(e.message));
			};

			this.ws.onclose = (e): void => {
				// connection closed
				console.log('Closing Up!');
				this.disconnect();
				this.onClose(e.code, e.reason);
			};
		});
	}

	/**
	 * register event
	 * @param msgType
	 * @param callback
	 */
	registerEvent(msgType: number, callback: Function): void {
		if (callback == null) {
			console.info('callback function is null');
			return;
		}
		if (msgType == null) {
			callback('msgType is null');
			return;
		}
		this.callbackMap[msgType] = callback;
	}

	/**
	 * remove event
	 * @param msgType
	 */
	removeEvent(msgType: number): void {
		this.callbackMap.delete(msgType);
		//console.info("----------> removeEvent");
	}

	/**
	 * Send custom request
	 * @param msg
	 * @param type
	 * @param callback
	 */
	sendJsonData(msg: string, type: number, callback: Function): void {
		if (!this.isConnectedToOBD) {
			console.log('please try to connect obd again');
			return;
		}

		if (this.isNotString(msg)) {
			console.log('error request content.');
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
			console.info('already connected');
			if (callback) callback('already connected');
			return;
		}

		this.globalCallback = globalCallback;

		if (url !== null && url.length > 0) {
			this.defaultUrl = url;
		}

		console.info('connect to ' + this.defaultUrl);
		try {
			this.ws = new WebSocket(this.defaultUrl);
			this.ws.onopen = (e): void => {
				console.info(e);

				console.info('connect success');
				if (callback !== null) {
					callback('connect success');
				}
				this.isConnectedToOBD = true;
			};
			this.ws.onmessage = (e): void => {
				let jsonData = JSON.parse(e.data);
				console.info(jsonData);
				this.getDataFromServer(jsonData);
			};

			this.ws.onclose = (e): Result<string> => {
				console.info('ws close', e);
				this.isConnectedToOBD = false;
				this.isLoggedIn = false;
				return err('ws close');
			};

			this.ws.onerror = (e): Result<string> => {
				console.info('ws error', e);
				return err('ws error');
			};
		} catch (e) {
			console.info(e);
			return err(e);
		}
	}

	// @ts-ignore
	sendData(msg: Message, callback: Function): Result<any> {
		if (!this.isConnectedToOBD) {
			return err('please try to connect obd again');
		}

		if (
			((msg.type <= -100000 && msg.type >= -102000) ||
				(msg.type <= -103000 && msg.type >= -104000)) &&
			this.isLoggedIn == false
		) {
			return err('please login');
		}

		console.info(
			new Date(),
			'----------------------------send msg------------------------------',
		);
		console.info(msg);
		if (callback !== null) {
			this.callbackMap[msg.type] = callback;
		}
		this.ws.send(JSON.stringify(msg));
	}

	getDataFromServer(jsonData: any): any {
		console.info(jsonData);

		if (this.globalCallback) this.globalCallback(jsonData);

		let callback = this.callbackMap[jsonData.type];
		if (jsonData.type == 0) return;

		if (jsonData.status == false) {
			//omni error ,do not alert
			if (jsonData.type == this.messageType.MsgType_Core_Omni_Getbalance_2112) {
				try {
					if (callback != null) return callback(err('Omni Error'));
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
		fromId = fromId.split('@')[0];
		toId = toId.split('@')[0];

		// This message is Alice send to Bob
		if (fromId !== toId) {
			if (callback !== null) {
				resultData['to_peer_id'] = toId;
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
				this.onLogIn(jsonData);
				break;
			case this.messageType.MsgType_UserLogout_2002:
				this.onLogout(jsonData);
				break;
			// case this.messageType.MsgType_Core_GetNewAddress_2101:
			//   this.onGetNewAddressFromOmniCore(jsonData);
			//   break;
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
				if (this.onAcceptChannel) this.onAcceptChannel(jsonData);
				break;
			case this.messageType.MsgType_FundingCreate_SendAssetFundingCreated_34:
				if (this.onAssetFundingCreated) this.onAssetFundingCreated(jsonData);
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
				if (this.on110353) this.on110353(jsonData);
				break;
			case this.messageType
				.MsgType_CommitmentTxSigned_RecvRevokeAndAcknowledgeCommitmentTransaction_352:
				if (this.on110352) this.on110352(jsonData);
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

	/**
	 * MsgType_UserLogin_2001
	 * @param mnemonic string
	 */
	async logIn(mnemonic: string): Promise<Result<ILogin>> {
		if (this.isLoggedIn) {
			return err('You are already logged in!');
		}

		if (this.isNotString(mnemonic)) {
			return err('empty mnemonic');
		}

		let msg = new Message();
		msg.type = this.messageType.MsgType_UserLogin_2001;
		msg.data['mnemonic'] = mnemonic;
		return new Promise(async (resolve) => this.sendData(msg, resolve));
	}

	userPeerId: string = '';

	onLogIn(resultData: any): void {
		if (!this.isLoggedIn) this.isLoggedIn = true;
	}

	disconnect(): void {
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
			return ok('You have logged out.');
		}
	}

	onLogout(jsonData: any): void {
		this.isLoggedIn = false;
	}

	/**
	 * MsgType_p2p_ConnectPeer_2003
	 * @param info P2PPeer
	 */
	async connectPeer(info: P2PPeer): Promise<Result<string>> {
		if (this.isNotString(info.remote_node_address)) {
			return err('Empty remote_node_address');
		}
		let msg = new Message();
		msg.data = info;
		msg.type = this.messageType.MsgType_p2p_ConnectPeer_2003;
		return new Promise((resolve) => this.sendData(msg, resolve));
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
	async fundingBitcoin(info: BtcFundingInfo): Promise<Result<IFundingBitcoin>> {
		if (this.isNotString(info.from_address)) {
			return err('empty from_address');
		}
		if (this.isNotString(info.to_address)) {
			return err('empty to_address');
		}
		if (info.amount == null || info.amount <= 0) {
			return err('wrong amount');
		}
		if (info.miner_fee == null || info.miner_fee <= 0) {
			info.miner_fee = 0;
		}

		let msg = new Message();
		msg.type = this.messageType.MsgType_Core_FundingBTC_2109;
		msg.data = info;
		return new Promise(async (resolve) => this.sendData(msg, resolve));
	}

	onFundingBitcoin(jsonData: any): void {}

	/**
	 * MsgType_FundingCreate_SendBtcFundingCreated_340
	 * @param recipient_node_peer_id string
	 * @param recipient_user_peer_id string
	 * @param info  FundingBtcCreated
	 */
	async bitcoinFundingCreated(
		recipient_node_peer_id: string,
		recipient_user_peer_id: string,
		info: FundingBtcCreated,
	): Promise<Result<IBitcoinFundingCreated>> {
		if (this.isNotString(recipient_node_peer_id)) {
			return err('error recipient_node_peer_id');
		}

		if (this.isNotString(recipient_user_peer_id)) {
			return err('error recipient_user_peer_id');
		}

		if (this.isNotString(info.temporary_channel_id)) {
			return err('empty temporary_channel_id');
		}
		if (this.isNotString(info.funding_tx_hex)) {
			return err('empty funding_tx_hex');
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
		signed_hex: string,
	): Promise<Result<ISendSignedHex100341>> {
		if (this.isNotString(recipient_node_peer_id)) {
			return err('error recipient_node_peer_id');
		}

		if (this.isNotString(recipient_user_peer_id)) {
			return err('error recipient_user_peer_id');
		}

		let msg = new Message();
		msg.type = this.messageType.MsgType_FundingCreate_BtcFundingMinerRDTxToClient_341;
		msg.recipient_user_peer_id = recipient_user_peer_id;
		msg.recipient_node_peer_id = recipient_node_peer_id;
		msg.data['hex'] = signed_hex;
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
		info: FundingBtcSigned,
	): Promise<Result<IBitcoinFundingSigned>> {
		if (this.isNotString(recipient_node_peer_id)) {
			return err('error recipient_node_peer_id');
		}
		if (this.isNotString(recipient_user_peer_id)) {
			return err('error recipient_user_peer_id');
		}
		if (this.isNotString(info.temporary_channel_id)) {
			return err('empty temporary_channel_id');
		}
		if (this.isNotString(info.funding_txid)) {
			return err('empty funding_txid');
		}
		if (this.isNotString(info.signed_miner_redeem_transaction_hex)) {
			return err('empty signed_miner_redeem_transaction_hex');
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
	async listProperties(): Promise<Result<any>> {
		let msg = new Message();
		msg.type = this.messageType.MsgType_Core_Omni_ListProperties_2117;
		return new Promise(async (resolve) => this.sendData(msg, resolve));
	}

	onListProperties(jsonData: any): void {}

	/**
	 * MsgType_Core_Omni_FundingAsset_2120
	 * @param info OmniFundingAssetInfo
	 */
	async fundingAsset(info: OmniFundingAssetInfo): Promise<Result<any>> {
		if (this.isNotString(info.from_address)) {
			return err('empty from_address');
		}
		if (this.isNotString(info.to_address)) {
			return err('empty to_address');
		}
		if (info.property_id == null || info.property_id <= 0) {
			return err('error property_id');
		}

		if (info.amount == null || info.amount <= 0) {
			return err('Incorrect amount');
		}
		if (info.miner_fee == null || info.miner_fee <= 0) {
			info.miner_fee = 0;
		}

		let msg = new Message();
		msg.type = this.messageType.MsgType_Core_Omni_FundingAsset_2120;
		msg.data = info;
		return new Promise(async (resolve) => this.sendData(msg, resolve));
	}

	onFundingAsset(jsonData: any): void {}

	/**
	 * MsgType_Core_Omni_Send_2121
	 * @param info OmniSendAssetInfo
	 */
	async sendAsset(info: OmniSendAssetInfo): Promise<Result<any>> {
		if (this.isNotString(info.from_address)) {
			return err('empty from_address');
		}
		if (this.isNotString(info.to_address)) {
			return err('empty to_address');
		}
		if (info.property_id == null || info.property_id <= 0) {
			return err('error property_id');
		}

		if (info.amount == null || info.amount <= 0) {
			return err('wrong amount');
		}

		let msg = new Message();
		msg.type = this.messageType.MsgType_Core_Omni_Send_2121;
		msg.data = info;
		return new Promise(async (resolve) => this.sendData(msg, resolve));
	}

	onSendAsset(jsonData: any): void {}

	/**
	 * MsgType_Mnemonic_CreateAddress_3000
	 */
	async genAddressFromMnemonic(): Promise<Result<any>> {
		let msg = new Message();
		msg.type = this.messageType.MsgType_Mnemonic_CreateAddress_3000;
		return new Promise(async (resolve) => this.sendData(msg, resolve));
	}

	onGenAddressFromMnemonic(jsonData: any): void {}

	/**
	 * MsgType_Mnemonic_GetAddressByIndex_3001
	 * @param index:number
	 */
	async getAddressInfo(index: number): Promise<Result<any>> {
		if (index == null || index < 0) {
			return err('error index');
		}

		let msg: Message = new Message();
		msg.type = this.messageType.MsgType_Mnemonic_GetAddressByIndex_3001;
		msg.data = index;
		return new Promise(async (resolve) => this.sendData(msg, resolve));
	}

	onGetAddressInfo(jsonData: any): void {}

	/**
	 * MsgType_SendChannelOpen_32
	 * @param recipient_node_peer_id string
	 * @param recipient_user_peer_id string
	 * @param info OpenChannelInfo
	 */
	async openChannel(
		recipient_node_peer_id: string,
		recipient_user_peer_id: string,
		info: OpenChannelInfo,
	): Promise<Result<string>> {
		if (this.isNotString(recipient_node_peer_id)) {
			return err('error recipient_node_peer_id');
		}

		if (this.isNotString(recipient_user_peer_id)) {
			return err('error recipient_user_peer_id');
		}

		if (this.isNotString(info.funding_pubkey)) {
			return err('error funding_pubkey');
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

	onOpenChannel(jsonData: any): void {}

	/**
	 * MsgType_SendChannelAccept_33
	 * @param recipient_node_peer_id string
	 * @param recipient_user_peer_id string
	 * @param info AcceptChannelInfo
	 */
	async acceptChannel(
		recipient_node_peer_id: string,
		recipient_user_peer_id: string,
		info: AcceptChannelInfo,
	): Promise<Result<IAcceptChannel>> {
		if (this.isNotString(recipient_node_peer_id)) {
			return err('error recipient_node_peer_id');
		}

		if (this.isNotString(recipient_user_peer_id)) {
			return err('error recipient_user_peer_id');
		}

		if (this.isNotString(info.temporary_channel_id)) {
			return err('empty temporary_channel_id');
		}

		if (info.approval == null) {
			info.approval = false;
		}

		if (info.approval) {
			if (this.isNotString(info.funding_pubkey)) {
				return err('empty funding_pubkey');
			}
		}

		let msg = new Message();
		msg.type = this.messageType.MsgType_SendChannelAccept_33;
		msg.recipient_node_peer_id = recipient_node_peer_id;
		msg.recipient_user_peer_id = recipient_user_peer_id;
		msg.data = info;
		return new Promise(async (resolve) => this.sendData(msg, resolve));
	}

	async onChannelOpenAttempt(data: TOnChannelOpenAttempt): Promise<any> {
		const listenerId = 'onChannelOpenAttempt';
		try {
			this.listener(listenerId, 'start', data);
			const {
				funder_node_address,
				funder_peer_id,
				temporary_channel_id,
			} = data.result;

			this.updateOmniboltCheckpoint({
				channelId: data.result.temporary_channel_id,
				checkpoint: 'onChannelOpenAttempt',
				data,
			});

			const channelAddress = this.data.nextAddressIndex;
			const funding_pubkey = channelAddress.publicKey;

			const info = {
				temporary_channel_id,
				funding_pubkey,
				approval: true,
				fundee_address_index: channelAddress.index,
			};

			const response = await this.acceptChannel(
				funder_node_address,
				funder_peer_id,
				info,
			);
			if (response.isErr()) {
				return this.listener(listenerId, 'failure', response.error.message);
			}
			const nextOmniboltAddress = await getNextOmniboltAddress({
				addressIndex: this.data.nextAddressIndex,
				selectedNetwork: this.selectedNetwork,
				mnemonic: this.mnemonic,
			});

			if (nextOmniboltAddress.isErr()) {
				return err(nextOmniboltAddress.error.message);
			}

			this.data.nextAddressIndex = nextOmniboltAddress.value;
			this.data.signingData[temporary_channel_id] = channelSigningData;
			this.data.signingData[temporary_channel_id] = {
				...this.data.signingData[temporary_channel_id],
				fundingAddress: channelAddress,
				addressIndex: channelAddress,
			};
			this.clearOmniboltCheckpoint({
				channelId: temporary_channel_id,
			});
			this.saveData(this.data);

			return this.listener('onChannelOpenAttempt', 'success', data);
		} catch (e) {
			return this.listener(listenerId, 'failure', e);
		}
	}

	async onAcceptChannel(data: TOnAcceptChannel): Promise<void> {
		await this.listener('onAcceptChannel', 'start', data);
		this.updateOmniboltCheckpoint({
			channelId: data.result.temporary_channel_id,
			checkpoint: 'onAcceptChannel',
			data,
		});
		this.listener('onAcceptChannel', 'success', data);
	}

	async onBitcoinFundingCreated(
		data: TOnBitcoinFundingCreated,
	): Promise<Result<IBitcoinFundingSigned>> {
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
			const fundingAddress = signingData.addressIndex;
			const privkey = await getPrivateKey({
				addressData: fundingAddress,
				selectedNetwork: this.selectedNetwork,
				mnemonic: this.mnemonic,
			});
			if (privkey.isErr()) {
				return this.listener(listenerId, 'failure', privkey.error.message);
			}
			const { funder_node_address, funder_peer_id, sign_data } = data.result;
			const signed_hex = await signP2SH({
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
			const response = await this.bitcoinFundingSigned(
				funder_node_address,
				funder_peer_id,
				info,
			);
			if (response.isErr()) {
				return this.listener(listenerId, 'failure', response.error.message);
			}
			//Save signing data if successful.
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
		} catch (e) {
			return this.listener(listenerId, 'failure', e);
		}
	}

	async onAssetFundingCreated(
		data: TOnAssetFundingCreated,
	): Promise<Result<ISendSignedHex101035>> {
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
			const privkey = await getPrivateKey({
				addressData: fundingAddress,
				selectedNetwork,
				mnemonic: this.mnemonic,
			});
			if (privkey.isErr()) {
				return this.listener(
					'onAssetFundingCreated',
					'failure',
					privkey.error.message,
				);
			}

			const { funder_node_address, funder_peer_id, sign_data } = data.result;
			const signed_hex = await signP2SH({
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

			const response = await this.assetFundingSigned(
				funder_node_address,
				funder_peer_id,
				info,
			);
			if (response.isErr()) {
				return this.listener(
					'onAssetFundingCreated',
					'failure',
					response.error.message,
				);
			}

			//Save signing data if successful.
			this.data.signingData[tempChannelId] = {
				...this.data.signingData[tempChannelId],
				kTbSignedHex: signed_hex,
			};
			const sendSignedHex101035Data = {
				funder_node_address,
				funder_peer_id,
				result: response.value,
			};
			this.updateOmniboltCheckpoint(
				{
					checkpoint: 'sendSignedHex101035',
					channelId: tempChannelId,
					data: sendSignedHex101035Data,
				},
				false,
			);
			this.saveData(this.data);

			this.listener(
				'onAssetFundingCreated',
				'success',
				sendSignedHex101035Data,
			);

			return await this.sendSignedHex101035({
				data: response.value,
				channelId: tempChannelId,
				recipient_node_peer_id: funder_node_address,
				recipient_user_peer_id: funder_peer_id,
			});
		} catch (e) {
			return err(e);
		}
	}

	async onCommitmentTransactionCreated(
		data: TOnCommitmentTransactionCreated,
	): Promise<Result<ISendSignedHex100361Response>> {
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

		// Receiver sign the tx on client side
		// NO.1 counterparty_raw_data
		const cr = data.result.counterparty_raw_data;
		const crInputs = cr.inputs;

		const privKeyResponse = await getPrivateKey({
			addressData: signingData.fundingAddress,
			mnemonic: this.mnemonic,
			selectedNetwork,
		});
		if (privKeyResponse.isErr()) {
			return this.listener(
				listenerId,
				'failure',
				privKeyResponse.error.message,
			);
		}
		const fundingPrivateKey = privKeyResponse.value;

		let cr_hex = await signP2SH({
			is_first_sign: false,
			txhex: cr.hex,
			pubkey_1: cr.pub_key_a,
			pubkey_2: cr.pub_key_b,
			privkey: fundingPrivateKey,
			inputs: crInputs,
			selectedNetwork,
		});

		// NO.2 rsmc_raw_data
		let rr = data.result.rsmc_raw_data;
		const rrInputs = rr.inputs;
		let rr_hex = await signP2SH({
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

		const addressIndexResponse = await getNextOmniboltAddress({
			addressIndex: this.data.nextAddressIndex,
			selectedNetwork: this.selectedNetwork,
			mnemonic: this.mnemonic,
		});
		if (addressIndexResponse.isErr()) {
			return this.listener(
				listenerId,
				'failure',
				addressIndexResponse.error.message,
			);
		}
		const newAddressIndex = addressIndexResponse.value;
		const newAddressIndexPrivKey = await getPrivateKey({
			addressData: newAddressIndex,
			selectedNetwork: this.selectedNetwork,
			mnemonic: this.mnemonic,
		});
		if (newAddressIndexPrivKey.isErr()) {
			return this.listener(
				listenerId,
				'failure',
				newAddressIndexPrivKey.error.message,
			);
		}
		let newTempPrivKey = newAddressIndexPrivKey.value || '';
		let lastTempPrivKey = signingData?.kTempPrivKey || '';

		// will send -100352 commitmentTransactionAccepted
		let info: CommitmentTxSigned = {
			channel_id: channelId,
			msg_hash: data.result.msg_hash,
			c2a_rsmc_signed_hex: rr_hex,
			c2a_counterparty_signed_hex: cr_hex,
			curr_temp_address_pub_key: newAddressIndex.publicKey,
			last_temp_address_private_key: lastTempPrivKey,
			approval: true,
			// Save address index to OBD and can get private key back if lose it.
			curr_temp_address_index: newAddressIndex.index,
		};
		const commitmentTransactionAcceptedResponse = await this.commitmentTransactionAccepted(
			nodeID,
			userID,
			info,
		);

		if (commitmentTransactionAcceptedResponse.isErr()) {
			return this.listener(
				listenerId,
				'failure',
				commitmentTransactionAcceptedResponse.error.message,
			);
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

		const commitTxAcceptedResponse = await this.handleCommitmentTransactionAccepted(
			checkpointData,
		);
		if (commitTxAcceptedResponse.isErr()) {
			return this.listener(
				listenerId,
				'failure',
				commitTxAcceptedResponse.error.message,
			);
		}
		const nextOmniboltAddress = await getNextOmniboltAddress({
			addressIndex: this.data.nextAddressIndex,
			selectedNetwork: this.selectedNetwork,
			mnemonic: this.mnemonic,
		});

		if (nextOmniboltAddress.isErr()) {
			return this.listener(
				listenerId,
				'failure',
				nextOmniboltAddress.error.message,
			);
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

	async handleCommitmentTransactionAccepted({
		info,
		userID,
		nodeID,
	}: ICommitmentTransactionAcceptedCheckpointData): Promise<
		Result<ISendSignedHex100361Response>
	> {
		const listenerId = 'commitmentTransactionAccepted';
		const selectedNetwork = this.selectedNetwork;
		const channelId = info.channel_id;
		const signingData = this.data.signingData[channelId];

		const e = info;
		// Receiver sign the tx on client side
		// NO.1 c2a_br_raw_data
		let ab = e.c2a_br_raw_data;
		let inputs = ab.inputs;

		const { fundingAddress } = signingData;
		const fundingPrivKey = await getPrivateKey({
			addressData: fundingAddress,
			mnemonic: this.mnemonic,
			selectedNetwork,
		});
		if (fundingPrivKey.isErr()) {
			return this.listener(listenerId, 'failure', fundingPrivKey.error.message);
		}
		let privkey = fundingPrivKey.value;
		let ab_hex = await signP2SH({
			is_first_sign: true,
			txhex: ab.hex,
			pubkey_1: ab.pub_key_a,
			pubkey_2: ab.pub_key_b,
			privkey,
			inputs,
			selectedNetwork,
		});

		// NO.2 c2a_rd_raw_data
		let ar = e.c2a_rd_raw_data;
		inputs = ar.inputs;
		let ar_hex = await signP2SH({
			is_first_sign: true,
			txhex: ar.hex,
			pubkey_1: ar.pub_key_a,
			pubkey_2: ar.pub_key_b,
			privkey,
			inputs,
			selectedNetwork,
		});

		// NO.3 c2b_counterparty_raw_data
		let bc = e.c2b_counterparty_raw_data;
		inputs = bc.inputs;
		let bc_hex = await signP2SH({
			is_first_sign: true,
			txhex: bc.hex,
			pubkey_1: bc.pub_key_a,
			pubkey_2: bc.pub_key_b,
			privkey,
			inputs,
			selectedNetwork,
		});

		// NO.4 c2b_rsmc_raw_data
		let br = e.c2b_rsmc_raw_data;
		inputs = br.inputs;
		let br_hex = await signP2SH({
			is_first_sign: true,
			txhex: br.hex,
			pubkey_1: br.pub_key_a,
			pubkey_2: br.pub_key_b,
			privkey,
			inputs,
			selectedNetwork,
		});

		// will send 100361
		let signedInfo: SignedInfo100361 = {
			channel_id: e.channel_id,
			c2b_rsmc_signed_hex: br_hex,
			c2b_counterparty_signed_hex: bc_hex,
			c2a_rd_signed_hex: ar_hex,
			c2a_br_signed_hex: ab_hex,
			c2a_br_id: ab.br_id,
		};

		const sendSignedHex100361Response = await this.sendSignedHex100361(
			nodeID,
			userID,
			signedInfo,
		);

		if (sendSignedHex100361Response.isErr()) {
			return this.listener(
				listenerId,
				'failure',
				sendSignedHex100361Response.error.message,
			);
		}
		this.data.signingData[channelId] = {
			...this.data.signingData[channelId],
			kTempPrivKey: privkey,
		};
		this.clearOmniboltCheckpoint({
			channelId,
		});
		this.saveData(this.data);
		return this.listener(
			listenerId,
			'success',
			sendSignedHex100361Response.value,
		);
	}

	async on110352(
		data: TOn110352,
	): Promise<Result<ISendSignedHex100363Response>> {
		const listenerId = 'on110352';
		this.listener(listenerId, 'start', data);
		const selectedNetwork = this.selectedNetwork;
		const channelId = data.result.channel_id;

		//Auto response to -110352
		this.updateOmniboltCheckpoint({
			channelId,
			checkpoint: listenerId,
			data,
		});

		const signingData = this.data.signingData[channelId];

		const e = data.result;
		let nodeID = e.payee_node_address;
		let userID = e.payee_peer_id;

		// Receiver sign the tx on client side
		// NO.1
		let rd = e.c2a_rd_partial_data;
		const rd_inputs = rd.inputs;
		const tempPrivKey = await getPrivateKey({
			addressData: signingData.addressIndex,
			mnemonic: this.mnemonic,
			selectedNetwork,
		});
		if (tempPrivKey.isErr()) {
			return this.listener(listenerId, 'failure', tempPrivKey.error.message);
		}
		let tempKey = tempPrivKey.value;
		let rd_hex = await signP2SH({
			is_first_sign: false,
			txhex: rd.hex,
			pubkey_1: rd.pub_key_a,
			pubkey_2: rd.pub_key_b,
			privkey: tempKey,
			inputs: rd_inputs,
			selectedNetwork,
		});

		// NO.2
		const fundingData = signingData.fundingAddress;
		const privKeyResult = await getPrivateKey({
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
		let cp_hex = await signP2SH({
			is_first_sign: false,
			txhex: cp.hex,
			pubkey_1: cp.pub_key_a,
			pubkey_2: cp.pub_key_b,
			privkey,
			inputs: cp_inputs,
			selectedNetwork,
		});

		// NO.3
		let rp = e.c2b_rsmc_partial_data;
		const rp_inputs = rp.inputs;
		let rp_hex = await signP2SH({
			is_first_sign: false,
			txhex: rp.hex,
			pubkey_1: rp.pub_key_a,
			pubkey_2: rp.pub_key_b,
			privkey,
			inputs: rp_inputs,
			selectedNetwork,
		});

		// will send 100362
		const signedInfo100362: SignedInfo100362 = {
			channel_id: e.channel_id,
			c2b_rsmc_signed_hex: rp_hex,
			c2b_counterparty_signed_hex: cp_hex,
			c2a_rd_signed_hex: rd_hex,
		};

		let resp = await this.sendSignedHex100362(nodeID, userID, signedInfo100362);
		if (resp.isErr()) {
			return this.listener(listenerId, 'failure', resp.error.message);
		}

		const sendSignedHex100363Data: ISendSignedHex100363 = {
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

	async handleSendSignedHex100363({
		data,
		privkey,
		channelId,
		nodeID,
		userID,
	}: ISendSignedHex100363): Promise<Result<ISendSignedHex100363Response>> {
		const listenerId = 'sendSignedHex100363';
		try {
			const selectedNetwork = this.selectedNetwork;
			this.listener(listenerId, 'start', data);
			// Receiver sign the tx on client side
			// NO.1 c2b_br_raw_data
			let br = data.c2b_br_raw_data;
			let br_inputs = br.inputs;
			let br_hex = await signP2SH({
				is_first_sign: true,
				txhex: br.hex,
				pubkey_1: br.pub_key_a,
				pubkey_2: br.pub_key_b,
				privkey,
				inputs: br_inputs,
				selectedNetwork,
			});

			// NO.2 c2b_rd_raw_data
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
			let rd_hex = await signP2SH(rdData);

			// will send 100363
			let signedInfo100363: SignedInfo100363 = {
				channel_id: channelId,
				c2b_rd_signed_hex: rd_hex,
				c2b_br_signed_hex: br_hex,
				c2b_br_id: br.br_id,
			};

			const sendSignedHex100363Res = await this.sendSignedHex100363(
				nodeID,
				userID,
				signedInfo100363,
			);

			if (sendSignedHex100363Res.isErr()) {
				return this.listener(
					listenerId,
					'failure',
					sendSignedHex100363Res.error.message,
				);
			}
			this.clearOmniboltCheckpoint({ channelId });
			this.saveData(this.data);
			return this.listener(listenerId, 'success', sendSignedHex100363Res.value);
		} catch (e) {
			return this.listener(listenerId, 'failure', e);
		}
	}

	async on110353(
		data: TOn110353,
	): Promise<Result<ISendSignedHex100364Response>> {
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
			// Receiver sign the tx on client side
			let rd = data.result.c2b_rd_partial_data;
			let inputs = rd.inputs;
			const signingData = this.data.signingData[channelId];
			const privKeyResponse = await getPrivateKey({
				addressData: signingData.addressIndex,
				mnemonic: this.mnemonic,
				selectedNetwork,
			});
			if (privKeyResponse.isErr()) {
				return this.listener(
					listenerId,
					'failure',
					privKeyResponse.error.message,
				);
			}
			//let tempKey = getTempPrivKey(e.to_peer_id, kTempPrivKey, e.channel_id);

			let rd_hex = await signP2SH({
				is_first_sign: false,
				txhex: rd.hex,
				pubkey_1: rd.pub_key_a,
				pubkey_2: rd.pub_key_b,
				privkey: privKeyResponse.value,
				inputs: inputs,
				selectedNetwork,
			});
			//let rd_hex  = await signP2SH(false, rd.hex, rd.pub_key_a, rd.pub_key_b, tempKey, inputs);

			// will send 100364
			let signedInfo: SignedInfo100364 = {
				channel_id: data.result.channel_id,
				c2b_rd_signed_hex: rd_hex,
			};
			const sendSignedHex100364Res = await this.sendSignedHex100364(signedInfo);
			if (sendSignedHex100364Res.isErr()) {
				return this.listener(
					listenerId,
					'failure',
					sendSignedHex100364Res.error.message,
				);
			}
			this.clearOmniboltCheckpoint({
				channelId: data.result.channel_id,
			});
			this.saveData(this.data);
			return this.listener(listenerId, 'success', sendSignedHex100364Res.value);
		} catch (e) {
			return this.listener(listenerId, 'failure', e);
		}
	}

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
		info: AcceptChannelInfo,
	): Promise<Result<any>> {
		if (this.isNotString(recipient_node_peer_id)) {
			return err('error recipient_node_peer_id');
		}

		if (this.isNotString(recipient_user_peer_id)) {
			return err('error recipient_user_peer_id');
		}

		if (this.isNotString(info.temporary_channel_id)) {
			return err('empty temporary_channel_id');
		}

		if (info.approval == null) {
			info.approval = false;
		}

		if (info.approval) {
			if (this.isNotString(info.funding_pubkey)) {
				return err('empty funding_pubkey');
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
		info: AssetFundingCreatedInfo,
	): Promise<Result<any>> {
		if (this.isNotString(recipient_node_peer_id)) {
			return err('error recipient_node_peer_id');
		}

		if (this.isNotString(recipient_user_peer_id)) {
			return err('error recipient_user_peer_id');
		}

		if (this.isNotString(info.temporary_channel_id)) {
			return err('empty temporary_channel_id');
		}
		if (this.isNotString(info.funding_tx_hex)) {
			return err('empty funding_tx_hex');
		}
		if (this.isNotString(info.temp_address_pub_key)) {
			return err('empty temp_address_pub_key');
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
		signed_hex: string,
	): Promise<Result<any>> {
		if (this.isNotString(recipient_node_peer_id)) {
			return err('error recipient_node_peer_id');
		}

		if (this.isNotString(recipient_user_peer_id)) {
			return err('error recipient_user_peer_id');
		}

		let msg = new Message();
		msg.type = this.messageType.MsgType_ClientSign_AssetFunding_AliceSignC1a_1034;
		msg.recipient_user_peer_id = recipient_user_peer_id;
		msg.recipient_node_peer_id = recipient_node_peer_id;
		msg.data['signed_c1a_hex'] = signed_hex;
		return new Promise(async (resolve) => this.sendData(msg, resolve));
	}

	/**
	 * MsgType_ClientSign_AssetFunding_AliceSignRD_1134
	 * @param info      SignedInfo101134
	 */
	async sendSignedHex101134(info: SignedInfo101134): Promise<Result<any>> {
		if (this.isNotString(info.channel_id)) {
			return err('empty channel_id');
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
		info: AssetFundingSignedInfo,
	): Promise<Result<IAssetFundingSigned>> {
		if (this.isNotString(recipient_node_peer_id)) {
			return err('error recipient_node_peer_id');
		}

		if (this.isNotString(recipient_user_peer_id)) {
			return err('error recipient_user_peer_id');
		}

		if (this.isNotString(info.temporary_channel_id)) {
			return err('empty temporary_channel_id');
		}

		if (this.isNotString(info.signed_alice_rsmc_hex)) {
			return err('empty signed_alice_rsmc_hex');
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
	 * @param {IAssetFundingSigned} data
	 * @param {string} channelId
	 * @param {string} recipient_node_peer_id
	 * @param {string} recipient_user_peer_id
	 */
	async sendSignedHex101035({
		data,
		channelId,
		recipient_node_peer_id,
		recipient_user_peer_id,
	}: {
		data: IAssetFundingSigned;
		channelId: string;
		recipient_node_peer_id: string;
		recipient_user_peer_id: string;
	}): Promise<Result<TSendSignedHex101035>> {
		const listenerId = 'sendSignedHex101035';
		try {
			this.listener(listenerId, 'start', data);
			const selectedNetwork = this.selectedNetwork;
			const channel_id = channelId;
			const signingData = this.data.signingData[channel_id];
			// Bob sign the tx on client side
			// NO.1 alice_br_sign_data
			let br = data.alice_br_sign_data;
			let inputs = br.inputs;
			let privkeyResponse = await getPrivateKey({
				addressData: signingData.fundingAddress,
				mnemonic: this.mnemonic,
				selectedNetwork,
			});
			if (privkeyResponse.isErr()) {
				return this.listener(
					listenerId,
					'failure',
					privkeyResponse.error.message,
				);
			}
			const privkey = privkeyResponse.value;
			let br_hex = await signP2SH({
				is_first_sign: true,
				txhex: br.hex,
				pubkey_1: br.pub_key_a,
				pubkey_2: br.pub_key_b,
				privkey,
				inputs,
				selectedNetwork,
			});

			// NO.2 alice_rd_sign_data
			let rd = data.alice_rd_sign_data;
			inputs = rd.inputs;
			let rd_hex = await signP2SH({
				is_first_sign: true,
				txhex: rd.hex,
				pubkey_1: rd.pub_key_a,
				pubkey_2: rd.pub_key_b,
				privkey,
				inputs,
				selectedNetwork,
			});

			// will send 101035
			const signedInfo: SignedInfo101035 = {
				temporary_channel_id: channel_id,
				rd_signed_hex: rd_hex,
				br_signed_hex: br_hex,
				br_id: br.br_id,
			};

			const sendSignedResponse: Result<ISendSignedHex101035> = await this.handleSendSignedHex101035(
				recipient_node_peer_id,
				recipient_user_peer_id,
				signedInfo,
			);
			if (sendSignedResponse.isErr()) {
				return this.listener(
					listenerId,
					'failure',
					sendSignedResponse.error.message,
				);
			}

			const newChannelId = sendSignedResponse.value.channel_id;
			const oldChannelId = data.temporary_channel_id;

			//Replace old channel id with the new channel id.
			delete Object.assign(this.data.signingData, {
				[newChannelId]: this.data.signingData[oldChannelId],
			})[oldChannelId];
			this.clearOmniboltCheckpoint({ channelId: channel_id });
			this.saveData(this.data);

			return this.listener(listenerId, 'success', sendSignedResponse);
		} catch (e) {
			return this.listener(listenerId, 'failure', e);
		}
	}

	async handleSendSignedHex101035(
		recipient_node_peer_id: string,
		recipient_user_peer_id: string,
		info: SignedInfo101035,
	): Promise<Result<TSendSignedHex101035>> {
		const listenerId = 'sendSignedHex101035';
		try {
			if (this.isNotString(recipient_node_peer_id)) {
				return this.listener(
					listenerId,
					'failure',
					'error recipient_node_peer_id',
				);
			}

			if (this.isNotString(recipient_user_peer_id)) {
				return this.listener(
					listenerId,
					'failure',
					'error recipient_user_peer_id',
				);
			}

			if (this.isNotString(info.temporary_channel_id)) {
				return this.listener(
					listenerId,
					'failure',
					'empty temporary_channel_id',
				);
			}

			let msg = new Message();
			msg.type = this.messageType.MsgType_ClientSign_Duplex_AssetFunding_RdAndBr_1035;
			msg.recipient_user_peer_id = recipient_user_peer_id;
			msg.recipient_node_peer_id = recipient_node_peer_id;
			msg.data = info;
			return new Promise(async (resolve) => this.sendData(msg, resolve));
		} catch (e) {
			return this.listener(listenerId, 'failure', e);
		}
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
		info: CommitmentTx,
	): Promise<Result<ICommitmentTransactionCreated>> {
		if (this.isNotString(recipient_node_peer_id)) {
			return err('error recipient_node_peer_id');
		}

		if (this.isNotString(recipient_user_peer_id)) {
			return err('error recipient_user_peer_id');
		}

		if (this.isNotString(info.channel_id)) {
			return err('empty channel_id');
		}
		if (this.isNotString(info.curr_temp_address_pub_key)) {
			return err('empty curr_temp_address_pub_key');
		}
		if (info.amount == null || info.amount <= 0) {
			return err('wrong amount');
		}

		let msg = new Message();
		msg.type = this.messageType.MsgType_CommitmentTx_SendCommitmentTransactionCreated_351;
		msg.recipient_user_peer_id = recipient_user_peer_id;
		msg.recipient_node_peer_id = recipient_node_peer_id;
		msg.data = info;
		return new Promise(async (resolve) => this.sendData(msg, resolve));
	}

	/**
	 * Type -100360 Protocol send signed info that Sender signed in 100351 to OBD.
	 * MsgType_ClientSign_CommitmentTx_AliceSignC2a_360
	 * @param recipient_node_peer_id string
	 * @param recipient_user_peer_id string
	 * @param info      SignedInfo100360
	 */
	async sendSignedHex100360(
		recipient_node_peer_id: string,
		recipient_user_peer_id: string,
		info: SignedInfo100360,
	): Promise<Result<any>> {
		if (this.isNotString(recipient_node_peer_id)) {
			return err('error recipient_node_peer_id');
		}

		if (this.isNotString(recipient_user_peer_id)) {
			return err('error recipient_user_peer_id');
		}

		if (this.isNotString(info.channel_id)) {
			return err('empty channel_id');
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
		info: CommitmentTxSigned,
	): Promise<Result<ICommitmentTransactionAcceptedResponse>> {
		if (this.isNotString(recipient_node_peer_id)) {
			return err('error recipient_node_peer_id');
		}

		if (this.isNotString(recipient_user_peer_id)) {
			return err('error recipient_user_peer_id');
		}

		if (this.isNotString(info.channel_id)) {
			return err('empty channel_id');
		}

		if (this.isNotString(info.msg_hash)) {
			return err('empty msg_hash');
		}

		if (info.approval == null) {
			info.approval = false;
		}
		if (info.approval == true) {
			if (this.isNotString(info.curr_temp_address_pub_key)) {
				return err('empty curr_temp_address_pub_key');
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
		info: SignedInfo100361,
	): Promise<Result<ISendSignedHex100361Response>> {
		if (this.isNotString(recipient_node_peer_id)) {
			return err('error recipient_node_peer_id');
		}

		if (this.isNotString(recipient_user_peer_id)) {
			return err('error recipient_user_peer_id');
		}

		if (this.isNotString(info.channel_id)) {
			return err('empty channel_id');
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
		info: SignedInfo100362,
	): Promise<Result<ISendSignedHex100362Response>> {
		if (this.isNotString(recipient_node_peer_id)) {
			return err('error recipient_node_peer_id');
		}

		if (this.isNotString(recipient_user_peer_id)) {
			return err('error recipient_user_peer_id');
		}

		if (this.isNotString(info.channel_id)) {
			return err('empty channel_id');
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
		info: SignedInfo100363,
	): Promise<Result<ISendSignedHex100363Response>> {
		if (this.isNotString(recipient_node_peer_id)) {
			return err('error recipient_node_peer_id');
		}

		if (this.isNotString(recipient_user_peer_id)) {
			return err('error recipient_user_peer_id');
		}

		if (this.isNotString(info.channel_id)) {
			return err('empty channel_id');
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
	async sendSignedHex100364(
		info: SignedInfo100364,
	): Promise<Result<ISendSignedHex100364Response>> {
		if (this.isNotString(info.channel_id)) {
			return err('empty channel_id');
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
	async addInvoice(info: InvoiceInfo): Promise<Result<any>> {
		if (info.property_id == null || info.property_id <= 0) {
			return err('empty property_id');
		}

		if (info.amount == null || info.amount <= 0) {
			return err('wrong amount');
		}

		if (this.isNotString(info.h)) {
			return err('empty h');
		}

		if (this.isNotString(info.expiry_time)) {
			return err('empty expiry_time');
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
	async HTLCFindPath(info: HTLCFindPathInfo): Promise<Result<any>> {
		if (!info.is_inv_pay) {
			if (info.property_id == null || info.property_id <= 0) {
				return err('empty property_id');
			}
			if (info.amount == null || info.amount < 0.001) {
				return err('wrong amount');
			}
			if (this.isNotString(info.h)) {
				return err('empty h');
			}
			if (this.isNotString(info.expiry_time)) {
				return err('empty expiry_time');
			}
		} else if (this.isNotString(info.invoice)) {
			return err('empty invoice');
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
		info: addHTLCInfo,
	): Promise<Result<any>> {
		if (this.isNotString(recipient_node_peer_id)) {
			return err('error recipient_node_peer_id');
		}

		if (this.isNotString(recipient_user_peer_id)) {
			return err('error recipient_user_peer_id');
		}

		if (this.isNotString(info.h)) {
			return err('empty h');
		}
		if (info.property_id <= 0) {
			return err('wrong property_id');
		}
		if (info.amount <= 0) {
			return err('wrong amount');
		}
		if (this.isNotString(info.memo)) {
			info.memo = '';
		}
		if (this.isNotString(info.routing_packet)) {
			return err('empty routing_packet');
		}
		if (info.cltv_expiry <= 0) {
			return err('wrong cltv_expiry');
		}
		if (this.isNotString(info.last_temp_address_private_key)) {
			return err('empty last_temp_address_private_key');
		}
		if (this.isNotString(info.curr_rsmc_temp_address_pub_key)) {
			return err('empty curr_rsmc_temp_address_pub_key');
		}
		if (this.isNotString(info.curr_htlc_temp_address_pub_key)) {
			return err('empty curr_htlc_temp_address_pub_key');
		}
		if (this.isNotString(info.curr_htlc_temp_address_for_ht1a_pub_key)) {
			return err('empty curr_htlc_temp_address_for_ht1a_pub_key');
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
		info: SignedInfo100100,
	): Promise<Result<any>> {
		if (this.isNotString(recipient_node_peer_id)) {
			return err('error recipient_node_peer_id');
		}

		if (this.isNotString(recipient_user_peer_id)) {
			return err('error recipient_user_peer_id');
		}

		if (this.isNotString(info.channel_id)) {
			return err('empty channel_id');
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
		info: SignedInfo100101,
	): Promise<Result<any>> {
		if (this.isNotString(recipient_node_peer_id)) {
			return err('error recipient_node_peer_id');
		}

		if (this.isNotString(recipient_user_peer_id)) {
			return err('error recipient_user_peer_id');
		}

		if (this.isNotString(info.channel_id)) {
			return err('empty channel_id');
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
	async sendSignedHex100102(info: SignedInfo100102): Promise<Result<any>> {
		if (this.isNotString(info.channel_id)) {
			return err('empty channel_id');
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
		info: SignedInfo100103,
	): Promise<Result<any>> {
		if (this.isNotString(recipient_node_peer_id)) {
			return err('error recipient_node_peer_id');
		}

		if (this.isNotString(recipient_user_peer_id)) {
			return err('error recipient_user_peer_id');
		}

		if (this.isNotString(info.channel_id)) {
			return err('empty channel_id');
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
	async sendSignedHex100104(info: SignedInfo100104): Promise<Result<any>> {
		if (this.isNotString(info.channel_id)) {
			return err('empty channel_id');
		}

		if (this.isNotString(info.curr_htlc_temp_address_for_he_pub_key)) {
			return err('empty curr_htlc_temp_address_for_he_pub_key');
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
	async sendSignedHex100105(
		recipient_node_peer_id: string,
		recipient_user_peer_id: string,
		info: SignedInfo100105,
	): Promise<Result<any>> {
		if (this.isNotString(recipient_node_peer_id)) {
			return err('error recipient_node_peer_id');
		}

		if (this.isNotString(recipient_user_peer_id)) {
			return err('error recipient_user_peer_id');
		}

		if (this.isNotString(info.channel_id)) {
			return err('empty channel_id');
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
	async sendSignedHex100106(
		recipient_node_peer_id: string,
		recipient_user_peer_id: string,
		info: SignedInfo100106,
	): Promise<Result<any>> {
		if (this.isNotString(recipient_node_peer_id)) {
			return err('error recipient_node_peer_id');
		}

		if (this.isNotString(recipient_user_peer_id)) {
			return err('error recipient_user_peer_id');
		}

		if (this.isNotString(info.channel_id)) {
			return err('empty channel_id');
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
	async sendSignedHex100110(
		recipient_node_peer_id: string,
		recipient_user_peer_id: string,
		info: SignedInfo100110,
	): Promise<Result<any>> {
		if (this.isNotString(recipient_node_peer_id)) {
			return err('error recipient_node_peer_id');
		}

		if (this.isNotString(recipient_user_peer_id)) {
			return err('error recipient_user_peer_id');
		}

		if (this.isNotString(info.channel_id)) {
			return err('empty channel_id');
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
		info: SignedInfo100111,
	): Promise<Result<any>> {
		if (this.isNotString(recipient_node_peer_id)) {
			return err('error recipient_node_peer_id');
		}

		if (this.isNotString(recipient_user_peer_id)) {
			return err('error recipient_user_peer_id');
		}

		if (this.isNotString(info.channel_id)) {
			return err('empty channel_id');
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
	async sendSignedHex100112(info: SignedInfo100112): Promise<Result<any>> {
		if (this.isNotString(info.channel_id)) {
			return err('empty channel_id');
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
		info: SignedInfo100113,
	): Promise<Result<any>> {
		if (this.isNotString(recipient_node_peer_id)) {
			return err('error recipient_node_peer_id');
		}

		if (this.isNotString(recipient_user_peer_id)) {
			return err('error recipient_user_peer_id');
		}

		if (this.isNotString(info.channel_id)) {
			return err('empty channel_id');
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
	async sendSignedHex100114(info: SignedInfo100114): Promise<Result<any>> {
		if (this.isNotString(info.channel_id)) {
			return err('empty channel_id');
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
		info: HtlcSignedInfo,
	): Promise<Result<any>> {
		if (this.isNotString(recipient_node_peer_id)) {
			return err('error recipient_node_peer_id');
		}
		if (this.isNotString(recipient_user_peer_id)) {
			return err('error recipient_user_peer_id');
		}
		if (this.isNotString(info.payer_commitment_tx_hash)) {
			return err('empty payer_commitment_tx_hash');
		}
		if (this.isNotString(info.curr_rsmc_temp_address_pub_key)) {
			return err('empty curr_rsmc_temp_address_pub_key');
		}
		if (this.isNotString(info.curr_htlc_temp_address_pub_key)) {
			return err('empty curr_htlc_temp_address_pub_key');
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
		info: ForwardRInfo,
	): Promise<Result<any>> {
		if (this.isNotString(recipient_node_peer_id)) {
			return err('error recipient_node_peer_id');
		}
		if (this.isNotString(recipient_user_peer_id)) {
			return err('error recipient_user_peer_id');
		}
		if (this.isNotString(info.channel_id)) {
			return err('empty channel_id');
		}

		if (this.isNotString(info.r)) {
			return err('empty r');
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
		info: SignRInfo,
	): Promise<Result<any>> {
		if (this.isNotString(recipient_node_peer_id)) {
			return err('error recipient_node_peer_id');
		}
		if (this.isNotString(recipient_user_peer_id)) {
			return err('error recipient_user_peer_id');
		}
		if (this.isNotString(info.channel_id)) {
			return err('empty channel_id');
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
		info: CloseHtlcTxInfo,
	): Promise<Result<any>> {
		if (this.isNotString(recipient_node_peer_id)) {
			return err('error recipient_node_peer_id');
		}
		if (this.isNotString(recipient_user_peer_id)) {
			return err('error recipient_user_peer_id');
		}
		if (this.isNotString(info.channel_id)) {
			return err('empty channel_id');
		}

		if (this.isNotString(info.last_rsmc_temp_address_private_key)) {
			return err('empty last_rsmc_temp_address_private_key');
		}
		if (this.isNotString(info.last_htlc_temp_address_private_key)) {
			return err('empty last_htlc_temp_address_private_key');
		}
		if (this.isNotString(info.last_htlc_temp_address_for_htnx_private_key)) {
			return err('empty last_htlc_temp_address_private_key');
		}
		if (this.isNotString(info.curr_temp_address_pub_key)) {
			return err('empty curr_rsmc_temp_address_pub_key');
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
		info: CloseHtlcTxInfoSigned,
	): Promise<Result<any>> {
		if (this.isNotString(recipient_node_peer_id)) {
			return err('error recipient_node_peer_id');
		}
		if (this.isNotString(recipient_user_peer_id)) {
			return err('error recipient_user_peer_id');
		}

		if (this.isNotString(info.msg_hash)) {
			return err('empty msg_hash');
		}
		if (this.isNotString(info.last_rsmc_temp_address_private_key)) {
			return err('empty last_rsmc_temp_address_private_key');
		}
		if (this.isNotString(info.last_htlc_temp_address_private_key)) {
			return err('empty last_htlc_temp_address_private_key');
		}
		if (this.isNotString(info.last_htlc_temp_address_for_htnx_private_key)) {
			return err('empty last_htlc_temp_address_for_htnx_private_key');
		}
		if (this.isNotString(info.curr_temp_address_pub_key)) {
			return err('empty curr_rsmc_temp_address_pub_key');
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
	async getTransaction(txid: string): Promise<Result<any>> {
		if (this.isNotString(txid)) {
			return err('empty txid');
		}
		let msg = new Message();
		msg.type = this.messageType.MsgType_Core_Omni_GetTransaction_2118;
		msg.data['txid'] = txid;
		return new Promise(async (resolve) => this.sendData(msg, resolve));
	}

	onGetTransaction(jsonData: any) {}

	/**
	 * MsgType_Core_Omni_CreateNewTokenFixed_2113
	 * @param info IssueFixedAmountInfo
	 */
	async issueFixedAmount(info: IssueFixedAmountInfo): Promise<Result<any>> {
		if (this.isNotString(info.from_address)) {
			return err('empty from_address');
		}
		if (this.isNotString(info.name)) {
			return err('empty name');
		}
		if (info.ecosystem == null) {
			return err('empty ecosystem');
		}
		if (info.divisible_type == null) {
			return err('empty divisible_type');
		}
		if (info.amount == null || info.amount <= 1) {
			return err('wrong amount');
		}
		if (this.isNotString(info.data)) {
			info.data = '';
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
	async issueManagedAmout(info: IssueManagedAmoutInfo): Promise<Result<any>> {
		if (this.isNotString(info.from_address)) {
			return err('empty from_address');
		}
		if (this.isNotString(info.name)) {
			return err('empty name');
		}
		if (info.ecosystem == null) {
			return err('empty ecosystem');
		}
		if (info.divisible_type == null) {
			return err('empty divisible_type');
		}
		if (this.isNotString(info.data)) {
			info.data = '';
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
	async sendGrant(info: OmniSendGrant): Promise<Result<any>> {
		if (this.isNotString(info.from_address)) {
			return err('empty from_address');
		}
		if (info.property_id == null || info.property_id < 1) {
			return err('empty property_id');
		}
		if (info.amount == null || info.amount <= 0) {
			return err('wrong amount');
		}
		if (this.isNotString(info.memo)) {
			info.memo = '';
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
	async sendRevoke(info: OmniSendRevoke): Promise<Result<any>> {
		if (this.isNotString(info.from_address)) {
			return err('empty from_address');
		}
		if (info.property_id == null || info.property_id < 1) {
			return err('empty property_id');
		}
		if (info.amount == null || info.amount <= 0) {
			return err('wrong amount');
		}
		if (this.isNotString(info.memo)) {
			info.memo = '';
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
	async getAllBalancesForAddress(address: string): Promise<Result<any>> {
		if (this.isNotString(address)) {
			return err('empty address');
		}
		let msg = new Message();
		msg.type = this.messageType.MsgType_Core_Omni_Getbalance_2112;
		msg.data['address'] = address;
		return new Promise(async (resolve) => this.sendData(msg, resolve));
	}

	onGetAllBalancesForAddress(jsonData: any) {}

	/**
	 * MsgType_Core_Omni_GetProperty_2119
	 * @param propertyId string
	 */
	async getProperty(propertyId: string): Promise<Result<IGetProperty>> {
		if (this.isNotString(propertyId)) {
			return err('empty propertyId');
		}
		let msg = new Message();
		msg.type = this.messageType.MsgType_Core_Omni_GetProperty_2119;
		msg.data['propertyId'] = propertyId;
		return new Promise(async (resolve) => this.sendData(msg, resolve));
	}

	onGetProperty(jsonData: any) {}

	/**
	 * MsgType_Core_BalanceByAddress_2108
	 * @param address string
	 */
	async getBtcBalanceByAddress(address: string): Promise<Result<any>> {
		if (this.isNotString(address)) {
			return err('empty address');
		}
		let msg = new Message();
		msg.type = this.messageType.MsgType_Core_BalanceByAddress_2108;
		msg.data['address'] = address;
		return new Promise(async (resolve) => this.sendData(msg, resolve));
	}

	onGetBtcBalanceByAddress(jsonData: any) {}

	/**
	 * MsgType_Core_Btc_ImportPrivKey_2111
	 * @param privkey string
	 */
	async importPrivKey(privkey: string): Promise<Result<any>> {
		if (this.isNotString(privkey)) {
			return err('empty privkey');
		}
		let msg = new Message();
		msg.type = this.messageType.MsgType_Core_Btc_ImportPrivKey_2111;
		msg.data['privkey'] = privkey;
		return new Promise(async (resolve) => this.sendData(msg, resolve));
	}

	onImportPrivKey(jsonData: any) {}

	/**
	 * MsgType_HTLC_CreatedRAndHInfoList_N4001
	 */
	async getAddHTLCRandHInfoList(): Promise<Result<any>> {
		let msg = new Message();
		//msg.type = this.messageType.MsgType_HTLC_CreatedRAndHInfoList_N4001;
		return new Promise(async (resolve) => this.sendData(msg, resolve));
	}

	onGetAddHTLCRandHInfoList(jsonData: any) {}

	/**
	 * MsgType_HTLC_SignedRAndHInfoList_N4101
	 */
	async getHtlcSignedRandHInfoList(): Promise<Result<any>> {
		let msg = new Message();
		// msg.type = this.messageType.MsgType_HTLC_SignedRAndHInfoList_N4101;
		return new Promise(async (resolve) => this.sendData(msg, resolve));
	}

	onGetHtlcSignedRandHInfoList(jsonData: any) {}

	/**
	 * MsgType_HTLC_GetRFromLCommitTx_N4103
	 * @param channel_id string
	 */
	async getRFromCommitmentTx(channel_id: string): Promise<Result<any>> {
		if (this.isNotString(channel_id)) {
			return err('empty channel_id');
		}
		let msg = new Message();
		// msg.type = this.messageType.MsgType_HTLC_GetRFromLCommitTx_N4103;
		msg.data['channel_id'] = channel_id;
		return new Promise(async (resolve) => this.sendData(msg, resolve));
	}

	onGetRFromCommitmentTx(jsonData: any) {}

	/**
	 * MsgType_HTLC_GetPathInfoByH_N4104
	 * @param h string
	 */
	async getPathInfoByH(h: string): Promise<Result<any>> {
		if (this.isNotString(h)) {
			return err('empty h');
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
	async getRByHOfReceiver(h: string): Promise<Result<any>> {
		if (this.isNotString(h)) {
			return err('empty h');
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
	async getLatestCommitmentTransaction(
		channel_id: string,
	): Promise<Result<any>> {
		if (this.isNotString(channel_id)) {
			return err('empty channel_id');
		}
		let msg = new Message();
		msg.type = this.messageType.MsgType_CommitmentTx_LatestCommitmentTxByChanId_3203;
		msg.data['channel_id'] = channel_id;
		return new Promise(async (resolve) => this.sendData(msg, resolve));
	}

	onGetLatestCommitmentTransaction(jsonData: any) {}

	/**
	 * MsgType_CommitmentTx_ItemsByChanId_3200
	 * @param channel_id string
	 */
	async getItemsByChannelId(channel_id: string): Promise<Result<any>> {
		if (this.isNotString(channel_id)) {
			return err('empty channel_id');
		}
		let msg = new Message();
		msg.type = this.messageType.MsgType_CommitmentTx_ItemsByChanId_3200;
		msg.data['channel_id'] = channel_id;
		return new Promise(async (resolve) => this.sendData(msg, resolve));
	}

	onGetItemsByChannelId(jsonData: any) {}

	/**
	 * MsgType_ChannelOpen_AllItem_3150
	 * @param page_size Number
	 * @param page_index Number
	 */
	async getMyChannels(
		page_size?: Number,
		page_index?: Number,
	): Promise<Result<IGetMyChannels>> {
		if (page_size == null || page_size <= 0) {
			page_size = 10;
		}

		if (page_index == null || page_index <= 0) {
			page_index = 1;
		}

		let msg = new Message();
		msg.type = this.messageType.MsgType_ChannelOpen_AllItem_3150;
		msg.data['page_size'] = page_size;
		msg.data['page_index'] = page_index;
		return new Promise(
			async (resolve): Promise<Result<IGetMyChannels>> =>
				this.sendData(msg, resolve),
		);
	}

	onGetMyChannels(jsonData: any) {}

	/**
	 * MsgType_GetMiniBtcFundAmount_2006
	 */
	async getAmountOfRechargeBTC(): Promise<Result<any>> {
		let msg = new Message();
		msg.type = this.messageType.MsgType_GetMiniBtcFundAmount_2006;
		return new Promise(async (resolve) => this.sendData(msg, resolve));
	}

	onGetAmountOfRechargeBTC(jsonData: any) {}

	/**
	 * MsgType_GetChannelInfoByChannelId_3154
	 * @param channel_id string
	 */
	async getChannelDetailFromChannelID(
		channel_id: string,
	): Promise<Result<any>> {
		if (this.isNotString(channel_id)) {
			return err('empty channel_id');
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
	async getChannelDetailFromDatabaseID(id: number): Promise<Result<any>> {
		if (id == null || id <= 0) {
			return err('error id');
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
	async getAllBreachRemedyTransactions(
		channel_id: string,
	): Promise<Result<any>> {
		if (this.isNotString(channel_id)) {
			return err('empty channel_id');
		}
		let msg = new Message();
		msg.type = this.messageType.MsgType_CommitmentTx_AllBRByChanId_3208;
		msg.data['channel_id'] = channel_id;
		return new Promise(async (resolve) => this.sendData(msg, resolve));
	}

	onGetAllBreachRemedyTransactions(jsonData: any) {}

	/**
	 * MsgType_CommitmentTx_ItemsByChanId_3200
	 * @param channel_id string
	 */
	async getAllCommitmentTx(channel_id: string): Promise<Result<any>> {
		if (this.isNotString(channel_id)) {
			return err('empty channel_id');
		}
		let msg = new Message();
		msg.type = this.messageType.MsgType_CommitmentTx_ItemsByChanId_3200;
		msg.data['channel_id'] = channel_id;
		return new Promise(async (resolve) => this.sendData(msg, resolve));
	}

	onGetAllCommitmentTx(jsonData: any) {}

	/**
	 * MsgType_CommitmentTx_LatestRDByChanId_3204
	 * @param channel_id string
	 */
	async getLatestRevockableDeliveryTransaction(
		channel_id: string,
	): Promise<Result<any>> {
		if (this.isNotString(channel_id)) {
			return err('empty channel_id');
		}
		let msg = new Message();
		msg.type = this.messageType.MsgType_CommitmentTx_LatestRDByChanId_3204;
		msg.data['channel_id'] = channel_id;
		return new Promise(async (resolve) => this.sendData(msg, resolve));
	}

	onGetLatestRevockableDeliveryTransaction(jsonData: any) {}

	/**
	 * MsgType_CommitmentTx_LatestBRByChanId_3205
	 * @param channel_id string
	 */
	async getLatestBreachRemedyTransaction(
		channel_id: string,
	): Promise<Result<any>> {
		if (this.isNotString(channel_id)) {
			return err('empty channel_id');
		}
		let msg = new Message();
		msg.type = this.messageType.MsgType_CommitmentTx_LatestBRByChanId_3205;
		msg.data['channel_id'] = channel_id;
		return new Promise(async (resolve) => this.sendData(msg, resolve));
	}

	onGetLatestBreachRemedyTransaction(jsonData: any) {}

	/**
	 * MsgType_CommitmentTx_SendSomeCommitmentById_3206
	 * @param id number
	 */
	async sendSomeCommitmentById(id: number): Promise<Result<any>> {
		if (id == null || id < 0) {
			return err('error id');
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
	async getAllRevockableDeliveryTransactions(
		channel_id: string,
	): Promise<Result<any>> {
		if (this.isNotString(channel_id)) {
			return err('empty channel_id');
		}
		let msg = new Message();
		msg.type = this.messageType.MsgType_CommitmentTx_AllRDByChanId_3207;
		msg.data['channel_id'] = channel_id;
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
		channel_id: string,
	): Promise<Result<ICloseChannel>> {
		if (this.isNotString(recipient_node_peer_id)) {
			return err('error recipient_node_peer_id');
		}

		if (this.isNotString(recipient_user_peer_id)) {
			return err('error recipient_user_peer_id');
		}

		if (this.isNotString(channel_id)) {
			return err('empty channel_id');
		}
		let msg = new Message();
		msg.type = this.messageType.MsgType_SendCloseChannelRequest_38;
		msg.data['channel_id'] = channel_id;
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
		info: CloseChannelSign,
	): Promise<Result<any>> {
		if (this.isNotString(recipient_node_peer_id)) {
			return err('error recipient_node_peer_id');
		}

		if (this.isNotString(recipient_user_peer_id)) {
			return err('error recipient_user_peer_id');
		}

		if (this.isNotString(info.channel_id)) {
			return err('empty channel_id');
		}

		if (info.approval == null) {
			info.approval = false;
		}

		if (info.approval) {
			if (this.isNotString(info.request_close_channel_hash)) {
				return err('empty request_close_channel_hash');
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
		info: AtomicSwapRequest,
	): Promise<Result<any>> {
		if (this.isNotString(recipient_node_peer_id)) {
			return err('error recipient_node_peer_id');
		}

		if (this.isNotString(recipient_user_peer_id)) {
			return err('error recipient_user_peer_id');
		}

		if (this.isNotString(info.channel_id_from)) {
			return err('empty channel_id_from');
		}
		if (this.isNotString(info.channel_id_to)) {
			return err('empty channel_id_to');
		}
		if (this.isNotString(info.recipient_user_peer_id)) {
			return err('empty recipient_user_peer_id');
		}
		if (this.isNotString(info.transaction_id)) {
			return err('empty transaction_id');
		}

		if (info.property_sent <= 0) {
			return err('wrong property_sent');
		}
		if (info.amount <= 0) {
			return err('wrong amount');
		}
		if (info.exchange_rate <= 0) {
			return err('wrong exchange_rate');
		}
		if (info.property_received <= 0) {
			return err('wrong property_received');
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
		info: AtomicSwapAccepted,
	): Promise<Result<any>> {
		if (this.isNotString(recipient_node_peer_id)) {
			return err('error recipient_node_peer_id');
		}

		if (this.isNotString(recipient_user_peer_id)) {
			return err('error recipient_user_peer_id');
		}

		if (this.isNotString(info.channel_id_from)) {
			return err('empty channel_id_from');
		}
		if (this.isNotString(info.channel_id_to)) {
			return err('empty channel_id_to');
		}
		if (this.isNotString(info.recipient_user_peer_id)) {
			return err('empty recipient_user_peer_id');
		}
		if (this.isNotString(info.transaction_id)) {
			return err('empty transaction_id');
		}
		if (this.isNotString(info.target_transaction_id)) {
			return err('empty target_transaction_id');
		}
		if (info.property_sent <= 0) {
			return err('wrong property_sent');
		}
		if (info.amount <= 0) {
			return err('wrong amount');
		}
		if (info.exchange_rate <= 0) {
			return err('wrong exchange_rate');
		}
		if (info.property_received <= 0) {
			return err('wrong property_received');
		}

		let msg = new Message();
		msg.type = this.messageType.MsgType_Atomic_SendSwapAccept_81;
		msg.data = info;
		msg.recipient_user_peer_id = recipient_user_peer_id;
		msg.recipient_node_peer_id = recipient_node_peer_id;
		return new Promise(async (resolve) => this.sendData(msg, resolve));
	}

	sendOmniAsset = async ({
		channelId,
		amount,
		recipient_node_peer_id,
		recipient_user_peer_id,
	}: {
		channelId: string;
		amount: number;
		recipient_node_peer_id: string;
		recipient_user_peer_id: string;
	}): Promise<Result<any>> => {
		try {
			const selectedNetwork = this.selectedNetwork;
			const signingData = this.data.signingData[channelId];
			const addressIndexResponse = await getNextOmniboltAddress({
				addressIndex: this.data.nextAddressIndex,
				mnemonic: this.mnemonic,
				selectedNetwork,
			});
			if (addressIndexResponse.isErr()) {
				return err(addressIndexResponse.error.message);
			}
			const newAddressIndex = addressIndexResponse.value;
			const newAddressIndexPrivKey = await getPrivateKey({
				addressData: newAddressIndex,
				mnemonic: this.mnemonic,
				selectedNetwork,
			});
			if (newAddressIndexPrivKey.isErr()) {
				return err(newAddressIndexPrivKey.error.message);
			}
			let newTempPrivKey = newAddressIndexPrivKey.value || '';
			let lastTempPrivKey = signingData?.kTempPrivKey || '';

			const info: CommitmentTx = {
				channel_id: channelId,
				amount,
				curr_temp_address_pub_key: newAddressIndex.publicKey,
				last_temp_address_private_key: lastTempPrivKey,
				curr_temp_address_index: newAddressIndex.index,
			};

			const response = await this.commitmentTransactionCreated(
				recipient_node_peer_id,
				recipient_user_peer_id,
				info,
			);

			if (response.isErr()) {
				return err(response.error);
			}
			const e = response.value;

			// Sender sign the tx on client side
			// NO.1 counterparty_raw_data
			let cr = e.counterparty_raw_data;
			let inputs = cr.inputs;

			console.info('START = ' + new Date().getTime());
			const fundingData = signingData.fundingAddress;
			const fundingPrivKey = await getPrivateKey({
				addressData: fundingData,
				mnemonic: this.mnemonic,
				selectedNetwork,
			});
			if (fundingPrivKey.isErr()) {
				return err(fundingPrivKey.error.message);
			}
			let privkey = fundingPrivKey.value;
			console.info('END READ DB = ' + new Date().getTime());

			let cr_hex = await signP2SH({
				is_first_sign: true,
				txhex: cr.hex,
				pubkey_1: cr.pub_key_a,
				pubkey_2: cr.pub_key_b,
				privkey,
				inputs,
				selectedNetwork,
			});

			console.info('END SIGN = ' + new Date().getTime());

			// NO.2 rsmc_raw_data
			let rr = e.rsmc_raw_data;
			inputs = rr.inputs;
			let rr_hex = await signP2SH({
				is_first_sign: true,
				txhex: rr.hex,
				pubkey_1: rr.pub_key_a,
				pubkey_2: rr.pub_key_b,
				privkey,
				inputs,
				selectedNetwork,
			});

			// will send 100360
			let signedInfo: SignedInfo100360 = {
				channel_id: e.channel_id,
				counterparty_signed_hex: cr_hex,
				rsmc_signed_hex: rr_hex,
			};

			const sendSignedHex100360Response = await this.sendSignedHex100360(
				recipient_node_peer_id,
				recipient_user_peer_id,
				signedInfo,
			);

			if (sendSignedHex100360Response.isErr()) {
				return err(sendSignedHex100360Response.error.message);
			}

			const nextAddressIndexResponse = await getNextOmniboltAddress({
				addressIndex: newAddressIndex,
				mnemonic: this.mnemonic,
				selectedNetwork,
			});
			if (nextAddressIndexResponse.isErr()) {
				return err(nextAddressIndexResponse.error.message);
			}

			this.data.nextAddressIndex = nextAddressIndexResponse.value;
			this.data.signingData[channelId] = {
				...this.data.signingData[channelId],
				addressIndex: newAddressIndex,
				kTempPrivKey: newTempPrivKey,
			};
			this.saveData(this.data);
			return ok('');
		} catch (e) {
			return err(e);
		}
	};

	isNotString(str: String): boolean {
		if (str == null) {
			return true;
		}
		return str.trim().length == 0;
	}

	listener(
		id: string,
		method: 'start' | 'failure' | 'success',
		data: any = '',
	): Result<any> {
		if (
			this?.listeners &&
			id in this.listeners &&
			method in this.listeners[id]
		) {
			this.listeners[id][method](data);
		}
		if (method === 'failure') return err(data);
		return ok(data);
	}

	/**
	 *
	 * @param {string} channelId
	 * @param {TOmniboltCheckpoints} checkpoint
	 * @param {boolean} save
	 * @param data
	 */
	updateOmniboltCheckpoint(
		{
			channelId,
			checkpoint,
			data,
		}: {
			channelId: string;
			checkpoint: TOmniboltCheckpoints;
			data: any;
		},
		save = true,
	) {
		try {
			this.data.checkpoints[channelId] = {
				checkpoint,
				data,
			};
			if (save) this.saveData(this.data);
		} catch (e) {
			console.log(e);
		}
	}

	/**
	 *
	 * @param {string} channelId
	 * @param {TOmniboltCheckpoints} checkpoint
	 */
	clearOmniboltCheckpoint({ channelId }: { channelId: string }) {
		try {
			if ('checkpoints' in this.data && channelId in this.data.checkpoints) {
				delete this.data.checkpoints[channelId];
			}
		} catch (e) {
			console.log(e);
		}
	}

	async resumeFromCheckpoints(): Promise<void> {
		const checkpoints = this.data.checkpoints;
		await Promise.all(
			Object.keys(checkpoints).map((channelId): void => {
				const id = checkpoints[channelId].checkpoint;
				switch (id) {
					case 'onChannelOpenAttempt':
						const onChannelOpenAttemptData: TOnChannelOpenAttempt =
							checkpoints[channelId].data;
						this.onChannelOpenAttempt(onChannelOpenAttemptData).then();
						break;
					case 'onBitcoinFundingCreated':
						const onBitcoinFundingCreatedData: TOnBitcoinFundingCreated =
							checkpoints[channelId].data;
						this.onBitcoinFundingCreated(onBitcoinFundingCreatedData).then();
						break;
					case 'onAssetFundingCreated':
						const onAssetFundingCreatedData: TOnAssetFundingCreated =
							checkpoints[channelId].data;
						this.onAssetFundingCreated(onAssetFundingCreatedData).then();
						break;
					case 'on110352':
						const on110352Data: TOn110352 = checkpoints[channelId].data;
						this.on110352(on110352Data);
						break;
					case 'on110353':
						const on110353Data: TOn110353 = checkpoints[channelId].data;
						this.on110353(on110353Data);
						break;
					case 'sendSignedHex100363':
						const sendSignedHex100363Data = checkpoints[channelId].data;
						this.handleSendSignedHex100363(sendSignedHex100363Data);
						break;
					case 'sendSignedHex101035':
						const sendSignedHex101035Data: {
							funder_node_address: string;
							funder_peer_id: string;
							result: IAssetFundingSigned;
						} = checkpoints[channelId].data;
						this.sendSignedHex101035({
							recipient_node_peer_id:
								sendSignedHex101035Data.funder_node_address,
							recipient_user_peer_id: sendSignedHex101035Data.funder_peer_id,
							data: sendSignedHex101035Data.result,
							channelId,
						});
						break;
					case 'onCommitmentTransactionCreated':
						this.onCommitmentTransactionCreated(checkpoints[channelId].data);
						break;
				}
			}),
		);
	}
}
