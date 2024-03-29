import { ECPairInterface } from 'bitcoinjs-lib';
export interface IConnect {
    recipient_node_peer_id: string;
    recipient_user_peer_id: string;
    sender_node_peer_id: string;
    sender_user_peer_id: string;
}
export interface ILogin {
    chainNodeType: string;
    htlcFeeRate: number;
    htlcMaxFee: number;
    nodeAddress: string;
    nodePeerId: string;
    userPeerId: string;
}
export interface IConnectResponse extends IConnect, ILogin {
}
export interface IOnChannelOpenAttempt {
    chain_hash: string;
    channel_reserve_satoshis: number;
    delayed_payment_base_point: string;
    dust_limit_satoshis: number;
    fee_rate_per_kw: number;
    funder_address_index: number;
    funder_node_address: string;
    funder_peer_id: string;
    funding_address: string;
    funding_pubkey: string;
    funding_satoshis: number;
    htlc_base_point: string;
    htlc_minimum_msat: number;
    is_private: boolean;
    length: number;
    max_accepted_htlcs: number;
    max_htlc_value_in_flight_msat: number;
    payment_base_point: string;
    push_msat: number;
    revocation_base_point: string;
    temporary_channel_id: string;
    to_self_delay: number;
    value: null;
    value_type: string;
}
export declare type TOnChannelOpenAttempt = IOmniboltResponse<IOnChannelOpenAttempt>;
export interface IAcceptChannel {
    accept_at: string;
    address_a: string;
    address_b: string;
    amount: number;
    btc_amount: number;
    chain_hash: string;
    channel_address: string;
    channel_address_redeem_script: string;
    channel_address_script_pub_key: string;
    channel_id: string;
    channel_reserve_satoshis: number;
    close_at: string;
    create_at: string;
    create_by: string;
    curr_state: number;
    delayed_payment_base_point: string;
    dust_limit_satoshis: number;
    fee_rate_per_kw: number;
    fundee_address_index: number;
    funder_address_index: number;
    funder_node_address: string;
    funder_peer_id: string;
    funding_address: string;
    funding_pubkey: string;
    funding_satoshis: number;
    htlc_base_point: string;
    htlc_minimum_msat: number;
    id: number;
    is_private: boolean;
    length: number;
    max_accepted_htlcs: number;
    max_htlc_value_in_flight_msat: number;
    payment_base_point: string;
    peer_id_a: string;
    peer_id_b: string;
    property_id: number;
    pub_key_a: string;
    pub_key_b: string;
    push_msat: number;
    refuse_reason: string;
    revocation_base_point: string;
    temporary_channel_id: string;
    to_self_delay: number;
    value: null;
    value_type: string;
}
export declare type TOnAcceptChannel = IOmniboltResponse<IAcceptChannel>;
export interface IOnChannelOpen {
    data: {
        asset_amount: number;
        balance_a: number;
        balance_b: number;
        balance_htlc: number;
        btc_amount: number;
        btc_funding_times: number;
        channel_address: string;
        channel_id: string;
        create_at: string;
        curr_state: number;
        is_private: false;
        num_updates: number;
        peer_ida: string;
        peer_idb: string;
        property_id: number;
        temporary_channel_id: string;
    }[];
}
export declare type TOnChannelOpen = IOmniboltResponse<IOnChannelOpen>;
export interface IGetMyChannelsData {
    asset_amount: number;
    balance_a: number;
    balance_b: number;
    balance_htlc: number;
    btc_amount: number;
    btc_funding_times: number;
    channel_address: string;
    channel_id: string;
    create_at: string;
    curr_state: number;
    is_private: boolean;
    peer_ida: string;
    peer_idb: string;
    property_id: number;
    temporary_channel_id: string;
}
export interface IGetMyChannels {
    data: IGetMyChannelsData[];
    pageNum: number;
    pageSize: number;
    totalCount: number;
    totalPage: number;
}
export interface IFundingInputs {
    amount: number;
    scriptPubKey: string;
    txid: string;
    vout: number;
}
export interface IFundingCreatedInputs extends IFundingInputs {
    redeemScript: string;
}
export interface IFundingBitcoin {
    hex: string;
    inputs: IFundingInputs[];
    is_multisig: boolean;
    total_in_amount: number;
}
export interface IBitcoinFundingCreated {
    hex: string;
    inputs: {
        amount: number;
        redeemScript: string;
        scriptPubKey: string;
        txid: string;
        vout: number;
    }[];
    is_multisig: boolean;
    pub_key_a: string;
    pub_key_b: string;
    temporary_channel_id: string;
    total_in_amount: number;
    total_out_amount: number;
}
export interface IInputs {
    amount: number;
    redeemScript: string;
    scriptPubKey: string;
    sequence: number;
    txid: string;
    vout: number;
}
export interface IListening110035 {
    channel_id: string;
    hex: string;
    inputs: IInputs[];
    is_multisig: boolean;
    pub_key_a: string;
    pub_key_b: string;
    temporary_channel_id: string;
    to_peer_id: string;
}
export interface IOnBitcoinFundingCreated {
    funder_node_address: string;
    funder_peer_id: string;
    funding_btc_hex: string;
    funding_redeem_hex: string;
    funding_txid: string;
    sign_data: {
        hex: string;
        inputs: IFundingCreatedInputs[];
        is_multisig: boolean;
        pub_key_a: string;
        pub_key_b: string;
        temporary_channel_id: string;
        total_in_amount: number;
        total_out_amount: number;
    };
}
export declare type TOnBitcoinFundingCreated = IOmniboltResponse<IOnBitcoinFundingCreated>;
export interface ISendSignedHex101034 extends IOnAssetFundingCreated {
}
export interface IOnAssetFundingCreated {
    c1a_rsmc_hex: string;
    channel_id: string;
    funder_node_address: string;
    funder_peer_id: string;
    funding_omni_hex: string;
    rsmc_temp_address_pub_key: string;
    sign_data: {
        hex: string;
        inputs: {
            amount: number;
            redeemScript: string;
            scriptPubKey: string;
            txid: string;
            vout: number;
        }[];
        is_multisig: boolean;
        pub_key_a: string;
        pub_key_b: string;
        temporary_channel_id: string;
        total_in_amount: number;
        total_out_amount: number;
    };
    temporary_channel_id: string;
    to_peer_id: string;
}
export declare type TOnAssetFundingCreated = IOmniboltResponse<IOnAssetFundingCreated>;
export interface ISendSignedHex100341 {
    signed_hex: string;
}
export interface IBitcoinFundingSigned {
    approval: true;
    funding_redeem_hex: string;
    funding_txid: string;
    temporary_channel_id: string;
}
export interface IAssetFundingSigned {
    alice_br_sign_data: {
        br_id: number;
        hex: string;
        inputs: IFundingInputs[];
        is_multisig: boolean;
        pub_key_a: string;
        pub_key_b: string;
    };
    alice_rd_sign_data: {
        hex: string;
        inputs: IFundingInputs[];
        is_multisig: true;
        pub_key_a: string;
        pub_key_b: string;
    };
    temporary_channel_id: string;
}
export interface ISendSignedHex101035 {
    channel_id: string;
}
export declare type TSendSignedHex101035 = ISendSignedHex101035;
export interface ICounterpartyRawData {
    hex: string;
    inputs: {
        amount: number;
        redeemScript: string;
        scriptPubKey: string;
        txid: string;
        vout: number;
    }[];
    is_multisig: true;
    private_key: string;
    pub_key_a: string;
    pub_key_b: string;
}
export interface IRSMCRawData {
    hex: string;
    inputs: {
        amount: number;
        redeemScript: string;
        scriptPubKey: string;
        txid: string;
        vout: number;
    }[];
    is_multisig: false;
    private_key: string;
    pub_key_a: string;
    pub_key_b: string;
}
export interface ICommitmentTransactionCreated {
    channel_id: string;
    counterparty_raw_data: ICounterpartyRawData;
    rsmc_raw_data: IRSMCRawData;
}
export interface IOnCommitmentTransactionCreated {
    amount: number;
    amount_a: number;
    amount_b: number;
    channel_id: string;
    commitment_tx_hash: string;
    counterparty_raw_data: ICounterpartyRawData;
    curr_temp_address_pub_key: string;
    last_temp_address_private_key: string;
    length: number;
    msg_hash: string;
    payer_node_address: string;
    payer_peer_id: string;
    rsmc_raw_data: IRSMCRawData;
    to_peer_id: string;
    value: null;
    value_type: string;
}
export declare type TOnCommitmentTransactionCreated = IOmniboltResponse<IOnCommitmentTransactionCreated>;
export interface ICommitmentInputs {
    amount: number;
    redeemScript: string;
    scriptPubKey: string;
    txid: string;
    vout: number;
}
export interface ICommitmentSequenceInputs extends ICommitmentInputs {
    sequence: number;
}
export interface ICommitmentTransactionAcceptedResponse {
    c2a_br_raw_data: {
        br_id: number;
        hex: string;
        inputs: ICommitmentInputs[];
        is_multisig: boolean;
        pub_key_a: string;
        pub_key_b: string;
    };
    c2a_rd_raw_data: {
        hex: string;
        inputs: ICommitmentSequenceInputs[];
        is_multisig: boolean;
        pub_key_a: string;
        pub_key_b: string;
    };
    c2b_counterparty_raw_data: {
        hex: string;
        inputs: ICommitmentInputs[];
        is_multisig: boolean;
        pub_key_a: string;
        pub_key_b: string;
    };
    c2b_rsmc_raw_data: {
        hex: string;
        inputs: ICommitmentInputs[];
        is_multisig: boolean;
        pub_key_a: string;
        pub_key_b: string;
    };
    channel_id: string;
}
export interface ISendSignedHex100361Response {
    approval: boolean;
    channel_id: string;
    commitment_tx_hash: string;
}
export interface ISendSignedHex100364Response {
    amount_to_counterparty: number;
    amount_to_rsmc: number;
    channel_id: string;
    create_at: string;
    create_by: string;
    curr_hash: string;
    curr_state: number;
    htlc_amount_to_payee: number;
    id: number;
    input_amount: number;
    input_txid: string;
    input_vout: number;
    last_commitment_tx_id: number;
    last_edit_time: string;
    last_hash: string;
    owner: string;
    peer_id_a: string;
    peer_id_b: string;
    property_id: number;
    rsmc_input_txid: string;
    rsmc_multi_address: string;
    rsmc_multi_address_script_pub_key: string;
    rsmc_redeem_script: string;
    rsmc_temp_address_index: number;
    rsmc_temp_address_pub_key: string;
    rsmc_tx_hex: string;
    rsmc_txid: string;
    send_at: string;
    sign_at: string;
    to_counterparty_tx_hex: string;
    to_counterparty_txid: string;
    tx_type: number;
}
export interface ISendSignedHex100362Response {
    c2b_br_raw_data: {
        br_id: number;
        hex: string;
        inputs: {
            amount: number;
            redeemScript: string;
            scriptPubKey: string;
            txid: string;
            vout: number;
        }[];
        is_multisig: boolean;
        private_key: string;
        pub_key_a: string;
        pub_key_b: string;
    };
    c2b_rd_raw_data: {
        hex: string;
        inputs: {
            amount: number;
            redeemScript: string;
            scriptPubKey: string;
            sequence: number;
            txid: string;
            vout: number;
        }[];
        is_multisig: boolean;
        private_key: string;
        pub_key_a: string;
        pub_key_b: string;
    };
    channel_id: string;
}
export interface ISendSignedHex100363Response {
    approval: boolean;
    channel_id: string;
    latest_commitment_tx_info: {
        amount_to_counterparty: number;
        amount_to_rsmc: number;
        channel_id: string;
        create_at: string;
        create_by: string;
        curr_hash: string;
        curr_state: number;
        htlc_amount_to_payee: number;
        id: number;
        input_amount: number;
        input_txid: string;
        input_vout: number;
        last_commitment_tx_id: number;
        last_edit_time: string;
        last_hash: string;
        owner: string;
        peer_id_a: string;
        peer_id_b: string;
        property_id: number;
        rsmc_input_txid: string;
        rsmc_multi_address: string;
        rsmc_multi_address_script_pub_key: string;
        rsmc_redeem_script: string;
        rsmc_temp_address_index: number;
        rsmc_temp_address_pub_key: string;
        rsmc_tx_hex: string;
        rsmc_txid: string;
        send_at: string;
        sign_at: string;
        to_counterparty_tx_hex: string;
        to_counterparty_txid: string;
        tx_type: number;
    };
}
export interface IOn110353 {
    c2b_rd_partial_data: {
        hex: string;
        inputs: {
            amount: number;
            redeemScript: string;
            scriptPubKey: string;
            sequence: number;
            txid: string;
            vout: number;
        }[];
        is_multisig: boolean;
        private_key: string;
        pub_key_a: string;
        pub_key_b: string;
    };
    channel_id: string;
    to_peer_id: string;
}
export declare type TOn110353 = IOmniboltResponse<IOn110353>;
export interface IOn110352 {
    c2a_rd_partial_data: {
        hex: string;
        inputs: {
            amount: number;
            redeemScript: string;
            scriptPubKey: string;
            sequence: number;
            txid: string;
            vout: number;
        }[];
        is_multisig: boolean;
        private_key: string;
        pub_key_a: string;
        pub_key_b: string;
    };
    c2b_counterparty_partial_data: {
        hex: string;
        inputs: {
            amount: number;
            redeemScript: string;
            scriptPubKey: string;
            txid: string;
            vout: number;
        }[];
        is_multisig: boolean;
        private_key: string;
        pub_key_a: string;
        pub_key_b: string;
    };
    c2b_rsmc_partial_data: {
        hex: string;
        inputs: {
            amount: number;
            redeemScript: string;
            scriptPubKey: string;
            txid: string;
            vout: number;
        }[];
        is_multisig: boolean;
        private_key: string;
        pub_key_a: string;
        pub_key_b: string;
    };
    channel_id: string;
    payee_node_address: string;
    payee_peer_id: string;
    to_peer_id: string;
}
export declare type TOn110352 = IOmniboltResponse<IOn110352>;
export interface IOmniboltResponse<T> extends IAdditionalResponseData {
    type: number;
    status: boolean;
    from: string;
    to: string;
    result: T;
}
export interface IAdditionalResponseData {
    pageNum?: number;
    pageSize?: number;
    totalCount?: number;
    totalPage?: number;
}
export interface IGetProperty {
    category: string;
    creationtxid: string;
    data: string;
    divisible: boolean;
    fixedissuance: boolean;
    issuer: string;
    managedissuance: boolean;
    name: string;
    propertyid: number;
    subcategory: string;
    totaltokens: string;
    url: string;
}
export interface ICloseChannel {
    accept_at: string;
    address_a: string;
    address_b: string;
    amount: number;
    btc_amount: number;
    chain_hash: string;
    channel_address: string;
    channel_address_redeem_script: string;
    channel_address_script_pub_key: string;
    channel_id: string;
    channel_reserve_satoshis: number;
    close_at: string;
    create_at: string;
    create_by: string;
    curr_state: number;
    delayed_payment_base_point: string;
    dust_limit_satoshis: number;
    fee_rate_per_kw: number;
    fundee_address_index: number;
    funder_address_index: number;
    funder_node_address: string;
    funder_peer_id: string;
    funding_address: string;
    funding_pubkey: string;
    funding_satoshis: number;
    htlc_base_point: string;
    htlc_minimum_msat: number;
    id: number;
    is_private: boolean;
    length: number;
    max_accepted_htlcs: number;
    max_htlc_value_in_flight_msat: number;
    payment_base_point: string;
    peer_id_a: string;
    peer_id_b: string;
    property_id: number;
    pub_key_a: string;
    pub_key_b: string;
    push_msat: number;
    refuse_reason: string;
    revocation_base_point: string;
    temporary_channel_id: string;
    to_self_delay: number;
    value: number | null;
    value_type: string;
}
export interface IAddressContent {
    index: number;
    path: string;
    address: string;
    scriptHash: string;
    publicKey: string;
}
export interface ISigningDataContent {
    fundingAddress: IAddressContent;
    addressIndex: IAddressContent;
    last_temp_address: IAddressContent;
    rsmc_temp_address: IAddressContent;
    htlc_temp_address: IAddressContent;
    htlc_temp_address_for_he1b: IAddressContent;
    kTbSignedHex: string;
    funding_txid: string;
    kTempPrivKey: string;
    kTbSignedHexCR110351: string;
    kTbSignedHexRR110351: string;
}
export interface ISigningData {
    [key: string]: ISigningDataContent;
}
export declare type TOmniboltCheckpoints = 'onChannelOpenAttempt' | 'channelAccept' | 'onAcceptChannel' | 'fundBitcoin' | 'onFundBitcoin' | 'onBitcoinFundingCreated' | 'onAssetFundingCreated' | 'sendSignedHex101035' | 'onCommitmentTransactionCreated' | 'commitmentTransactionAccepted' | 'on110353' | 'on110352' | 'htlcFindPath' | 'onHtlcFindPath' | 'addHtlc' | 'onAddHtlc' | 'htlcSIgned' | 'onHtlcSigned' | 'forwardR' | 'onForwardR' | 'signR' | 'onSignR' | 'closeHtlc' | 'onCloseHtlc' | 'closeHtlcSigned' | 'onCloseHtlcSigned' | 'onChannelCloseAttempt' | 'sendSignedHex100363';
export interface ICheckpoint {
    checkpoint: TOmniboltCheckpoints;
    data: any;
}
export interface ICheckpoints {
    [key: string]: ICheckpoint;
}
export interface IFundingAddress extends IAddressContent {
    assets: [];
}
export declare type TFundingAddresses = {
    [key: string]: IAddressContent;
};
export interface IData {
    nextAddressIndex: IAddressContent;
    signingData: ISigningData;
    checkpoints: ICheckpoints;
    fundingAddresses: TFundingAddresses;
}
export interface ISaveData {
    nextAddressIndex: IAddressContent;
    signingData: ISigningData;
    checkpoints: ICheckpoints;
    fundingAddresses: TFundingAddresses;
}
export declare type TAvailableNetworks = 'bitcoin' | 'bitcoinTestnet';
export interface IGetAddress {
    keyPair: ECPairInterface | undefined;
    network: INetwork | undefined;
    type?: 'bech32' | 'segwit' | 'legacy';
}
export interface INetwork {
    messagePrefix: string;
    bech32: string;
    bip32: {
        public: number;
        private: number;
    };
    pubKeyHash: number;
    scriptHash: number;
    wif: number;
}
export interface IChannelSigningData {
    fundingAddress: IAddressContent;
    addressIndex: IAddressContent;
    last_temp_address: IAddressContent;
    rsmc_temp_address: IAddressContent;
    htlc_temp_address: IAddressContent;
    htlc_temp_address_for_he1b: IAddressContent;
    kTbSignedHex: string;
    funding_txid: string;
    kTempPrivKey: string;
    kTbSignedHexCR110351: string;
    kTbSignedHexRR110351: string;
    kTbTempData: string;
}
export declare type IListeners = {
    [key in TOmniboltCheckpoints]?: IListenerParams<any, any>;
};
export interface IListenerParams<TStart, TSuccess> {
    start: (data: TStart) => any;
    success: (data: TSuccess) => any;
    failure: (data: any) => any;
}
export interface ISignP2PKH {
    txhex: string;
    inputs: IFundingInputs[];
    privkey: string;
    selectedNetwork?: TAvailableNetworks;
}
export interface ISignP2SH {
    is_first_sign: boolean;
    txhex: string;
    pubkey_1: string;
    pubkey_2: string;
    privkey: string;
    inputs: any;
    selectedNetwork?: TAvailableNetworks | undefined;
}
export interface ISendSignedHex100363 {
    data: ISendSignedHex100362Response;
    privkey: string;
    channelId: string;
    nodeID: string;
    userID: string;
}
export interface ISendSignedHex101134 {
    channel_id: string;
    temporary_channel_id: string;
}
export interface ICommitmentTransactionAcceptedCheckpointData {
    info: ICommitmentTransactionAcceptedResponse;
    nodeID: string;
    userID: string;
}
export interface IOpenChannel {
    chain_hash: string;
    channel_reserve_satoshis: number;
    delayed_payment_base_point: string;
    dust_limit_satoshis: number;
    fee_rate_per_kw: number;
    funder_address_index: number;
    funder_node_address: string;
    funder_peer_id: string;
    funding_address: string;
    funding_pubkey: string;
    funding_satoshis: number;
    htlc_base_point: string;
    htlc_minimum_msat: number;
    is_private: boolean;
    length: number;
    max_accepted_htlcs: number;
    max_htlc_value_in_flight_msat: number;
    payment_base_point: string;
    push_msat: number;
    revocation_base_point: string;
    temporary_channel_id: string;
    to_self_delay: number;
    value: number | null;
    value_type: string;
}
export interface IFundAssetResponse {
    hex: string;
    inputs: {
        amount: number;
        scriptPubKey: string;
        txid: string;
        vout: number;
    }[];
}
export interface IFundingInfo {
    fundingAddressIndex?: number;
    amount_to_fund?: number;
    miner_fee?: number;
    asset_id: number;
    asset_amount: number;
}
export interface IConnectUri {
    remote_node_address: string;
    recipient_user_peer_id: string;
}
export interface ICreateChannel extends IConnectUri {
    info: IFundingInfo;
}
export interface IFundTempChannel {
    recipient_node_peer_id: string;
    recipient_user_peer_id: string;
    temporary_channel_id: string;
    info: IFundingInfo;
}
export interface IParseOmniboltUriResponse {
    action: string;
    data: {
        remote_node_address?: string;
        recipient_user_peer_id?: string;
        [key: string]: any;
    };
}
export interface IGenerateOmniboltUri {
    action: string;
    data: string | object;
}
export interface IGetAllBalancesForAddressResponse {
    balance: string;
    frozen: string;
    name: string;
    propertyid: number;
    reserved: string;
}
export interface IGetTransactionResponse {
    amount: string;
    block: number;
    blockhash: string;
    blocktime: number;
    category: string;
    confirmations: number;
    data: string;
    divisible: boolean;
    ecosystem: string;
    fee: string;
    ismine: boolean;
    positioninblock: number;
    propertyid: number;
    propertyname: string;
    propertytype: string;
    sendingaddress: string;
    subcategory: string;
    txid: string;
    type: string;
    type_int: number;
    url: string;
    valid: boolean;
    version: number;
}
