import { MessageType, Message, P2PPeer, BtcFundingInfo, FundingBtcCreated, FundingBtcSigned, OmniFundingAssetInfo, OmniSendAssetInfo, OpenChannelInfo, AcceptChannelInfo, AssetFundingCreatedInfo, AssetFundingSignedInfo, SignedInfo100100, SignedInfo100101, SignedInfo100102, SignedInfo100103, SignedInfo100104, SignedInfo100105, SignedInfo100106, SignedInfo100110, SignedInfo100111, SignedInfo100112, SignedInfo100113, SignedInfo100114, SignedInfo100360, SignedInfo100361, SignedInfo100362, SignedInfo100363, SignedInfo100364, SignedInfo101035, SignedInfo101134, CommitmentTx, CommitmentTxSigned, InvoiceInfo, HTLCFindPathInfo, addHTLCInfo, HtlcSignedInfo, ForwardRInfo, SignRInfo, CloseHtlcTxInfo, CloseHtlcTxInfoSigned, IssueFixedAmountInfo, IssueManagedAmoutInfo, OmniSendGrant, OmniSendRevoke, CloseChannelSign, AtomicSwapAccepted, AtomicSwapRequest } from './pojo';
import { Result } from './result';
import { IAcceptChannel, IConnect, IGetMyChannels, ILogin, IFundingBitcoin, IBitcoinFundingCreated, ISendSignedHex100341, TOnBitcoinFundingCreated, TOnChannelOpenAttempt, IBitcoinFundingSigned, TOnAssetFundingCreated, IAssetFundingSigned, TSendSignedHex101035, TOnCommitmentTransactionCreated, ICommitmentTransactionAcceptedResponse, ISendSignedHex100361Response, TOnAcceptChannel, TOn110353, ICommitmentTransactionCreated, TOn110352, ISendSignedHex100364Response, ISendSignedHex100362Response, ISendSignedHex100363Response, IGetProperty, ICloseChannel, ISaveData, TAvailableNetworks, ISendSignedHex101035, TOmniboltCheckpoints, ISendSignedHex100363, ICommitmentTransactionAcceptedCheckpointData, IListeners } from './types';
export default class ObdApi {
    constructor({ url, loginPhrase, mnemonic, data, saveData, listeners, selectedNetwork, onOpen, onClose, onError, websocket, verbose, }?: {
        url?: string;
        loginPhrase?: string;
        mnemonic?: string;
        data?: ISaveData;
        saveData?: (data: ISaveData) => any;
        listeners?: IListeners | {};
        selectedNetwork?: TAvailableNetworks;
        onOpen?: (data: string) => any;
        onError?: (data: any) => any;
        onClose?: (code: number, reason: string) => any;
        websocket?: WebSocket;
        verbose?: boolean;
    });
    isConnectedToOBD: boolean;
    isLoggedIn: boolean;
    messageType: MessageType;
    websocket: WebSocket | any;
    ws: WebSocket | any;
    defaultUrl: string;
    loginPhrase: string;
    mnemonic: string;
    data: ISaveData;
    saveData: (data: ISaveData) => any;
    listeners: IListeners | {};
    selectedNetwork: TAvailableNetworks;
    globalCallback: Function | undefined;
    callbackMap: Map<number, Function>;
    onOpen: (data: string) => any;
    onError: (data: any) => any;
    onClose: (code: number, reason: string) => any;
    onMessage: Function | undefined;
    onChannelCloseAttempt: ((data: any) => any) | undefined;
    onChannelClose: Function | undefined;
    loginData: {
        nodeAddress: string;
        nodePeerId: string;
        userPeerId: string;
    };
    verbose: boolean;
    connect({ url, data, saveData, loginPhrase, mnemonic, listeners, selectedNetwork, onMessage, onChannelCloseAttempt, onChannelClose, onOpen, onError, onClose, onAddHTLC, onForwardR, onSignR, onCloseHTLC, }: {
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
    }): Promise<Result<IConnect>>;
    registerEvent(msgType: number, callback: Function): void;
    removeEvent(msgType: number): void;
    sendJsonData(msg: string, type: number, callback: Function): void;
    connectToServer(url: string, callback: Function, globalCallback: Function): import("./result").Err<unknown> | undefined;
    sendData(msg: Message, callback: Function): Result<any>;
    getDataFromServer(jsonData: any): any;
    logIn(mnemonic: string): Promise<Result<ILogin>>;
    userPeerId: string;
    onLogIn(resultData: any): void;
    disconnect(): void;
    logout(): Promise<unknown>;
    onLogout(jsonData: any): void;
    connectPeer(info: P2PPeer): Promise<Result<string>>;
    fundingBitcoin(info: BtcFundingInfo): Promise<Result<IFundingBitcoin>>;
    onFundingBitcoin(jsonData: any): void;
    bitcoinFundingCreated(recipient_node_peer_id: string, recipient_user_peer_id: string, info: FundingBtcCreated): Promise<Result<IBitcoinFundingCreated>>;
    sendSignedHex100341(recipient_node_peer_id: string, recipient_user_peer_id: string, signed_hex: string): Promise<Result<ISendSignedHex100341>>;
    bitcoinFundingSigned(recipient_node_peer_id: string, recipient_user_peer_id: string, info: FundingBtcSigned): Promise<Result<IBitcoinFundingSigned>>;
    listProperties(): Promise<Result<any>>;
    onListProperties(jsonData: any): void;
    fundingAsset(info: OmniFundingAssetInfo): Promise<Result<any>>;
    onFundingAsset(jsonData: any): void;
    sendAsset(info: OmniSendAssetInfo): Promise<Result<any>>;
    onSendAsset(jsonData: any): void;
    genAddressFromMnemonic(): Promise<Result<any>>;
    onGenAddressFromMnemonic(jsonData: any): void;
    getAddressInfo(index: number): Promise<Result<any>>;
    onGetAddressInfo(jsonData: any): void;
    openChannel(recipient_node_peer_id: string, recipient_user_peer_id: string, info: OpenChannelInfo): Promise<Result<string>>;
    onOpenChannel(jsonData: any): void;
    acceptChannel(recipient_node_peer_id: string, recipient_user_peer_id: string, info: AcceptChannelInfo): Promise<Result<IAcceptChannel>>;
    onChannelOpenAttempt(data: TOnChannelOpenAttempt): Promise<any>;
    onAcceptChannel(data: TOnAcceptChannel): Promise<void>;
    onBitcoinFundingCreated(data: TOnBitcoinFundingCreated): Promise<Result<IBitcoinFundingSigned>>;
    onAssetFundingCreated(data: TOnAssetFundingCreated): Promise<Result<ISendSignedHex101035>>;
    onCommitmentTransactionCreated(data: TOnCommitmentTransactionCreated): Promise<Result<ISendSignedHex100361Response>>;
    handleCommitmentTransactionAccepted({ info, userID, nodeID, }: ICommitmentTransactionAcceptedCheckpointData): Promise<Result<ISendSignedHex100361Response>>;
    on110352(data: TOn110352): Promise<Result<ISendSignedHex100363Response>>;
    handleSendSignedHex100363({ data, privkey, channelId, nodeID, userID, }: ISendSignedHex100363): Promise<Result<ISendSignedHex100363Response>>;
    on110353(data: TOn110353): Promise<Result<ISendSignedHex100364Response>>;
    checkChannelAddessExist(recipient_node_peer_id: string, recipient_user_peer_id: string, info: AcceptChannelInfo): Promise<Result<any>>;
    onCheckChannelAddessExist(jsonData: any): void;
    assetFundingCreated(recipient_node_peer_id: string, recipient_user_peer_id: string, info: AssetFundingCreatedInfo): Promise<Result<any>>;
    sendSignedHex101034(recipient_node_peer_id: string, recipient_user_peer_id: string, signed_hex: string): Promise<Result<any>>;
    sendSignedHex101134(info: SignedInfo101134): Promise<Result<any>>;
    assetFundingSigned(recipient_node_peer_id: string, recipient_user_peer_id: string, info: AssetFundingSignedInfo): Promise<Result<IAssetFundingSigned>>;
    onAssetFundingSigned(jsonData: any): void;
    sendSignedHex101035({ data, channelId, recipient_node_peer_id, recipient_user_peer_id, }: {
        data: IAssetFundingSigned;
        channelId: string;
        recipient_node_peer_id: string;
        recipient_user_peer_id: string;
    }): Promise<Result<TSendSignedHex101035>>;
    handleSendSignedHex101035(recipient_node_peer_id: string, recipient_user_peer_id: string, info: SignedInfo101035): Promise<Result<TSendSignedHex101035>>;
    commitmentTransactionCreated(recipient_node_peer_id: string, recipient_user_peer_id: string, info: CommitmentTx): Promise<Result<ICommitmentTransactionCreated>>;
    sendSignedHex100360(recipient_node_peer_id: string, recipient_user_peer_id: string, info: SignedInfo100360): Promise<Result<any>>;
    commitmentTransactionAccepted(recipient_node_peer_id: string, recipient_user_peer_id: string, info: CommitmentTxSigned): Promise<Result<ICommitmentTransactionAcceptedResponse>>;
    onCommitmentTransactionAccepted(jsonData: any): void;
    sendSignedHex100361(recipient_node_peer_id: string, recipient_user_peer_id: string, info: SignedInfo100361): Promise<Result<ISendSignedHex100361Response>>;
    sendSignedHex100362(recipient_node_peer_id: string, recipient_user_peer_id: string, info: SignedInfo100362): Promise<Result<ISendSignedHex100362Response>>;
    sendSignedHex100363(recipient_node_peer_id: string, recipient_user_peer_id: string, info: SignedInfo100363): Promise<Result<ISendSignedHex100363Response>>;
    sendSignedHex100364(info: SignedInfo100364): Promise<Result<ISendSignedHex100364Response>>;
    addInvoice(info: InvoiceInfo): Promise<Result<any>>;
    onAddInvoice(jsonData: any): void;
    HTLCFindPath(info: HTLCFindPathInfo): Promise<Result<any>>;
    onHTLCFindPath(jsonData: any): void;
    addHTLC(recipient_node_peer_id: string, recipient_user_peer_id: string, info: addHTLCInfo): Promise<Result<any>>;
    onAddHTLC(jsonData: any): void;
    sendSignedHex100100(recipient_node_peer_id: string, recipient_user_peer_id: string, info: SignedInfo100100): Promise<Result<any>>;
    sendSignedHex100101(recipient_node_peer_id: string, recipient_user_peer_id: string, info: SignedInfo100101): Promise<Result<any>>;
    sendSignedHex100102(info: SignedInfo100102): Promise<Result<any>>;
    sendSignedHex100103(recipient_node_peer_id: string, recipient_user_peer_id: string, info: SignedInfo100103): Promise<Result<any>>;
    sendSignedHex100104(info: SignedInfo100104): Promise<Result<any>>;
    sendSignedHex100105(recipient_node_peer_id: string, recipient_user_peer_id: string, info: SignedInfo100105): Promise<Result<any>>;
    sendSignedHex100106(recipient_node_peer_id: string, recipient_user_peer_id: string, info: SignedInfo100106): Promise<Result<any>>;
    sendSignedHex100110(recipient_node_peer_id: string, recipient_user_peer_id: string, info: SignedInfo100110): Promise<Result<any>>;
    sendSignedHex100111(recipient_node_peer_id: string, recipient_user_peer_id: string, info: SignedInfo100111): Promise<Result<any>>;
    sendSignedHex100112(info: SignedInfo100112): Promise<Result<any>>;
    sendSignedHex100113(recipient_node_peer_id: string, recipient_user_peer_id: string, info: SignedInfo100113): Promise<Result<any>>;
    sendSignedHex100114(info: SignedInfo100114): Promise<Result<any>>;
    htlcSigned(recipient_node_peer_id: string, recipient_user_peer_id: string, info: HtlcSignedInfo): Promise<Result<any>>;
    onHtlcSigned(jsonData: any): void;
    forwardR(recipient_node_peer_id: string, recipient_user_peer_id: string, info: ForwardRInfo): Promise<Result<any>>;
    onForwardR(jsonData: any): void;
    signR(recipient_node_peer_id: string, recipient_user_peer_id: string, info: SignRInfo): Promise<Result<any>>;
    onSignR(jsonData: any): void;
    closeHTLC(recipient_node_peer_id: string, recipient_user_peer_id: string, info: CloseHtlcTxInfo): Promise<Result<any>>;
    onCloseHTLC(jsonData: any): void;
    closeHTLCSigned(recipient_node_peer_id: string, recipient_user_peer_id: string, info: CloseHtlcTxInfoSigned): Promise<Result<any>>;
    onCloseHTLCSigned(jsonData: any): void;
    getTransaction(txid: string): Promise<Result<any>>;
    onGetTransaction(jsonData: any): void;
    issueFixedAmount(info: IssueFixedAmountInfo): Promise<Result<any>>;
    onIssueFixedAmount(jsonData: any): void;
    issueManagedAmout(info: IssueManagedAmoutInfo): Promise<Result<any>>;
    onIssueManagedAmout(jsonData: any): void;
    sendGrant(info: OmniSendGrant): Promise<Result<any>>;
    onSendGrant(jsonData: any): void;
    sendRevoke(info: OmniSendRevoke): Promise<Result<any>>;
    onSendRevoke(jsonData: any): void;
    getAllBalancesForAddress(address: string): Promise<Result<any>>;
    onGetAllBalancesForAddress(jsonData: any): void;
    getProperty(propertyId: string): Promise<Result<IGetProperty>>;
    onGetProperty(jsonData: any): void;
    getBtcBalanceByAddress(address: string): Promise<Result<any>>;
    onGetBtcBalanceByAddress(jsonData: any): void;
    importPrivKey(privkey: string): Promise<Result<any>>;
    onImportPrivKey(jsonData: any): void;
    getAddHTLCRandHInfoList(): Promise<Result<any>>;
    onGetAddHTLCRandHInfoList(jsonData: any): void;
    getHtlcSignedRandHInfoList(): Promise<Result<any>>;
    onGetHtlcSignedRandHInfoList(jsonData: any): void;
    getRFromCommitmentTx(channel_id: string): Promise<Result<any>>;
    onGetRFromCommitmentTx(jsonData: any): void;
    getPathInfoByH(h: string): Promise<Result<any>>;
    onGetPathInfoByH(jsonData: any): void;
    getRByHOfReceiver(h: string): Promise<Result<any>>;
    onGetRByHOfReceiver(jsonData: any): void;
    getLatestCommitmentTransaction(channel_id: string): Promise<Result<any>>;
    onGetLatestCommitmentTransaction(jsonData: any): void;
    getItemsByChannelId(channel_id: string): Promise<Result<any>>;
    onGetItemsByChannelId(jsonData: any): void;
    getMyChannels(page_size?: Number, page_index?: Number): Promise<Result<IGetMyChannels>>;
    onGetMyChannels(jsonData: any): void;
    getAmountOfRechargeBTC(): Promise<Result<any>>;
    onGetAmountOfRechargeBTC(jsonData: any): void;
    getChannelDetailFromChannelID(channel_id: string): Promise<Result<any>>;
    onGetChannelDetailFromChannelID(jsonData: any): void;
    getChannelDetailFromDatabaseID(id: number): Promise<Result<any>>;
    onGetChannelDetailFromDatabaseID(jsonData: any): void;
    getAllBreachRemedyTransactions(channel_id: string): Promise<Result<any>>;
    onGetAllBreachRemedyTransactions(jsonData: any): void;
    getAllCommitmentTx(channel_id: string): Promise<Result<any>>;
    onGetAllCommitmentTx(jsonData: any): void;
    getLatestRevockableDeliveryTransaction(channel_id: string): Promise<Result<any>>;
    onGetLatestRevockableDeliveryTransaction(jsonData: any): void;
    getLatestBreachRemedyTransaction(channel_id: string): Promise<Result<any>>;
    onGetLatestBreachRemedyTransaction(jsonData: any): void;
    sendSomeCommitmentById(id: number): Promise<Result<any>>;
    onSendSomeCommitmentById(jsonData: any): void;
    getAllRevockableDeliveryTransactions(channel_id: string): Promise<Result<any>>;
    onGetAllRevockableDeliveryTransactions(jsonData: any): void;
    closeChannel(recipient_node_peer_id: string, recipient_user_peer_id: string, channel_id: string): Promise<Result<ICloseChannel>>;
    onCloseChannel(jsonData: any): void;
    closeChannelSigned(recipient_node_peer_id: string, recipient_user_peer_id: string, info: CloseChannelSign): Promise<Result<any>>;
    onCloseChannelSigned(jsonData: any): void;
    atomicSwap(recipient_node_peer_id: string, recipient_user_peer_id: string, info: AtomicSwapRequest): Promise<Result<any>>;
    atomicSwapAccepted(recipient_node_peer_id: string, recipient_user_peer_id: string, info: AtomicSwapAccepted): Promise<Result<any>>;
    sendOmniAsset: ({ channelId, amount, recipient_node_peer_id, recipient_user_peer_id, }: {
        channelId: string;
        amount: number;
        recipient_node_peer_id: string;
        recipient_user_peer_id: string;
    }) => Promise<Result<any>>;
    isNotString(str: String): boolean;
    listener(id: string, method: 'start' | 'failure' | 'success', data?: any): Result<any>;
    updateOmniboltCheckpoint({ channelId, checkpoint, data, }: {
        channelId: string;
        checkpoint: TOmniboltCheckpoints;
        data: any;
    }, save?: boolean): void;
    clearOmniboltCheckpoint({ channelId }: {
        channelId: string;
    }): void;
    resumeFromCheckpoints(): Promise<void>;
    logMsg: (p1?: any, p2?: string) => void;
}
