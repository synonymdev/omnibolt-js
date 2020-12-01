export declare class Message {
    type: number;
    data: object | string | number;
    recipient_user_peer_id: string;
    recipient_node_peer_id: string;
}
export declare class BtcFundingInfo {
    from_address: string;
    from_address_private_key: string;
    to_address: string;
    amount: number;
    miner_fee: number;
}
export declare class FundingBtcCreated {
    temporary_channel_id: string;
    funding_tx_hex: string;
}
export declare class FundingBtcSigned {
    temporary_channel_id: string;
    funding_txid: string;
    signed_miner_redeem_transaction_hex: string;
    approval: boolean;
}
export declare class OmniFundingAssetInfo {
    from_address: string;
    to_address: string;
    property_id: number;
    amount: number;
    miner_fee: number;
}
export declare class OmniSendAssetInfo {
    from_address: string;
    to_address: string;
    property_id: number;
    amount: number;
}
export declare class OpenChannelInfo {
    funding_pubkey: string;
    funder_address_index: number;
    is_private: boolean;
}
export declare class AcceptChannelInfo {
    temporary_channel_id: string;
    funding_pubkey: string;
    fundee_address_index: number;
    approval: boolean;
}
export declare class AssetFundingCreatedInfo {
    temporary_channel_id: string;
    funding_tx_hex: string;
    temp_address_pub_key: string;
    temp_address_index: number;
}
export declare class AssetFundingSignedInfo {
    temporary_channel_id: string;
    signed_alice_rsmc_hex: string;
}
export declare class SignedInfo101035 {
    temporary_channel_id: string;
    rd_signed_hex: string;
    br_signed_hex: string;
    br_id: number;
}
export declare class SignedInfo101134 {
    channel_id: string;
    rd_signed_hex: string;
}
export declare class SignedInfo100360 {
    channel_id: string;
    rsmc_signed_hex: string;
    counterparty_signed_hex: string;
}
export declare class SignedInfo100361 {
    channel_id: string;
    c2b_rsmc_signed_hex: string;
    c2b_counterparty_signed_hex: string;
    c2a_rd_signed_hex: string;
    c2a_br_signed_hex: string;
    c2a_br_id: number;
}
export declare class SignedInfo100362 {
    channel_id: string;
    c2b_rsmc_signed_hex: string;
    c2b_counterparty_signed_hex: string;
    c2a_rd_signed_hex: string;
}
export declare class SignedInfo100363 {
    channel_id: string;
    c2b_rd_signed_hex: string;
    c2b_br_signed_hex: string;
    c2b_br_id: number;
}
export declare class SignedInfo100364 {
    channel_id: string;
    c2b_rd_signed_hex: string;
}
export declare class SignedInfo100100 {
    channel_id: string;
    c3a_counterparty_partial_signed_hex: string;
    c3a_htlc_partial_signed_hex: string;
    c3a_rsmc_partial_signed_hex: string;
}
export declare class SignedInfo100101 {
    channel_id: string;
    c3a_rsmc_rd_partial_signed_hex: string;
    c3a_rsmc_br_partial_signed_hex: string;
    c3a_htlc_ht_partial_signed_hex: string;
    c3a_htlc_hlock_partial_signed_hex: string;
    c3a_htlc_br_partial_signed_hex: string;
    c3b_rsmc_partial_signed_hex: string;
    c3b_counterparty_partial_signed_hex: string;
    c3b_htlc_partial_signed_hex: string;
}
export declare class SignedInfo100102 {
    channel_id: string;
    c3a_rsmc_rd_complete_signed_hex: string;
    c3a_htlc_ht_complete_signed_hex: string;
    c3a_htlc_hlock_complete_signed_hex: string;
    c3b_rsmc_complete_signed_hex: string;
    c3b_counterparty_complete_signed_hex: string;
    c3b_htlc_complete_signed_hex: string;
}
export declare class SignedInfo100103 {
    channel_id: string;
    c3a_htlc_htrd_partial_signed_hex: string;
    c3b_rsmc_rd_partial_signed_hex: string;
    c3b_rsmc_br_partial_signed_hex: string;
    c3b_htlc_htd_partial_signed_hex: string;
    c3b_htlc_hlock_partial_signed_hex: string;
    c3b_htlc_br_partial_signed_hex: string;
}
export declare class SignedInfo100104 {
    channel_id: string;
    curr_htlc_temp_address_for_he_pub_key: string;
    curr_htlc_temp_address_for_he_index: number;
    c3a_htlc_htrd_complete_signed_hex: string;
    c3a_htlc_htbr_partial_signed_hex: string;
    c3a_htlc_hed_partial_signed_hex: string;
    c3b_rsmc_rd_complete_signed_hex: string;
    c3b_htlc_htd_complete_signed_hex: string;
    c3b_htlc_hlock_complete_signed_hex: string;
}
export declare class SignedInfo100105 {
    channel_id: string;
    c3b_htlc_hlock_he_partial_signed_hex: string;
}
export declare class SignedInfo100106 {
    channel_id: string;
    c3b_htlc_herd_partial_signed_hex: string;
}
export declare class SignedInfo100110 {
    channel_id: string;
    counterparty_partial_signed_hex: string;
    rsmc_partial_signed_hex: string;
}
export declare class SignedInfo100111 {
    channel_id: string;
    c4a_rd_signed_hex: string;
    c4a_br_signed_hex: string;
    c4a_br_id: string;
    c4b_rsmc_signed_hex: string;
    c4b_counterparty_signed_hex: string;
}
export declare class SignedInfo100112 {
    channel_id: string;
    c4a_rd_complete_signed_hex: string;
    c4b_rsmc_complete_signed_hex: string;
    c4b_counterparty_complete_signed_hex: string;
}
export declare class SignedInfo100113 {
    channel_id: string;
    c4b_rd_partial_signed_hex: string;
    c4b_br_partial_signed_hex: string;
    c4b_br_id: string;
}
export declare class SignedInfo100114 {
    channel_id: string;
    c4b_rd_complete_signed_hex: string;
}
export declare class CommitmentTx {
    channel_id: string;
    amount: number;
    curr_temp_address_pub_key: string;
    curr_temp_address_index: number;
    last_temp_address_private_key: string;
}
export declare class CommitmentTxSigned {
    channel_id: string;
    msg_hash: string;
    c2a_rsmc_signed_hex: string;
    c2a_counterparty_signed_hex: string;
    curr_temp_address_pub_key: string;
    curr_temp_address_index: number;
    last_temp_address_private_key: string;
    approval: boolean;
}
export declare class InvoiceInfo {
    property_id: number;
    amount: number;
    h: string;
    expiry_time: string;
    description: string;
    is_private: boolean;
}
export declare class HTLCFindPathInfo extends InvoiceInfo {
    invoice: string;
    recipient_node_peer_id: string;
    recipient_user_peer_id: string;
}
export declare class addHTLCInfo {
    recipient_user_peer_id: string;
    property_id: number;
    amount: number;
    memo: string;
    h: string;
    routing_packet: string;
    cltv_expiry: number;
    last_temp_address_private_key: string;
    curr_rsmc_temp_address_pub_key: string;
    curr_rsmc_temp_address_index: number;
    curr_htlc_temp_address_pub_key: string;
    curr_htlc_temp_address_index: number;
    curr_htlc_temp_address_for_ht1a_pub_key: string;
    curr_htlc_temp_address_for_ht1a_index: number;
}
export declare class HtlcSignedInfo {
    payer_commitment_tx_hash: string;
    curr_rsmc_temp_address_pub_key: string;
    curr_rsmc_temp_address_index: number;
    curr_htlc_temp_address_pub_key: string;
    curr_htlc_temp_address_index: number;
    last_temp_address_private_key: string;
    c3a_complete_signed_rsmc_hex: string;
    c3a_complete_signed_counterparty_hex: string;
    c3a_complete_signed_htlc_hex: string;
}
export declare class SignGetHInfo {
    request_hash: string;
    channel_address_private_key: string;
    last_temp_address_private_key: string;
    curr_rsmc_temp_address_pub_key: string;
    curr_rsmc_temp_address_private_key: string;
    curr_htlc_temp_address_pub_key: string;
    curr_htlc_temp_address_private_key: string;
    approval: boolean;
}
export declare class HtlcRequestOpen {
    request_hash: string;
    channel_address_private_key: string;
    last_temp_address_private_key: string;
    curr_rsmc_temp_address_pub_key: string;
    curr_rsmc_temp_address_private_key: string;
    curr_htlc_temp_address_pub_key: string;
    curr_htlc_temp_address_private_key: string;
    curr_htlc_temp_address_for_ht1a_pub_key: string;
    curr_htlc_temp_address_for_ht1a_private_key: string;
}
export declare class ForwardRInfo {
    channel_id: string;
    r: string;
}
export declare class SignRInfo {
    channel_id: string;
    c3b_htlc_herd_complete_signed_hex: string;
    c3b_htlc_hebr_partial_signed_hex: string;
}
export declare class CloseHtlcTxInfo {
    channel_id: string;
    last_rsmc_temp_address_private_key: string;
    last_htlc_temp_address_private_key: string;
    last_htlc_temp_address_for_htnx_private_key: string;
    curr_temp_address_pub_key: string;
    curr_temp_address_index: number;
}
export declare class CloseHtlcTxInfoSigned {
    msg_hash: string;
    last_rsmc_temp_address_private_key: string;
    last_htlc_temp_address_private_key: string;
    last_htlc_temp_address_for_htnx_private_key: string;
    curr_temp_address_pub_key: string;
    curr_temp_address_index: number;
}
export declare class IssueManagedAmoutInfo {
    from_address: string;
    name: string;
    ecosystem: number;
    divisible_type: number;
    data: string;
}
export declare class IssueFixedAmountInfo extends IssueManagedAmoutInfo {
    amount: number;
}
export declare class OmniSendGrant {
    from_address: string;
    property_id: number;
    amount: number;
    memo: string;
}
export declare class OmniSendRevoke extends OmniSendGrant {
}
export declare class CloseChannelSign {
    channel_id: string;
    request_close_channel_hash: string;
    approval: boolean;
}
export declare class AtomicSwapRequest {
    channel_id_from: string;
    channel_id_to: string;
    recipient_user_peer_id: string;
    property_sent: number;
    amount: number;
    exchange_rate: number;
    property_received: number;
    transaction_id: string;
    time_locker: number;
}
export declare class AtomicSwapAccepted extends AtomicSwapRequest {
    target_transaction_id: string;
}
export declare class P2PPeer {
    remote_node_address: string;
}
export declare class MessageType {
    MsgType_Error_0: number;
    MsgType_UserLogin_2001: number;
    MsgType_UserLogout_2002: number;
    MsgType_p2p_ConnectPeer_2003: number;
    MsgType_GetMnemonic_2004: number;
    MsgType_GetMiniBtcFundAmount_2006: number;
    MsgType_Core_GetNewAddress_2101: number;
    MsgType_Core_GetMiningInfo_2102: number;
    MsgType_Core_GetNetworkInfo_2103: number;
    MsgType_Core_SignMessageWithPrivKey_2104: number;
    MsgType_Core_VerifyMessage_2105: number;
    MsgType_Core_DumpPrivKey_2106: number;
    MsgType_Core_ListUnspent_2107: number;
    MsgType_Core_BalanceByAddress_2108: number;
    MsgType_Core_FundingBTC_2109: number;
    MsgType_Core_BtcCreateMultiSig_2110: number;
    MsgType_Core_Btc_ImportPrivKey_2111: number;
    MsgType_Core_Omni_Getbalance_2112: number;
    MsgType_Core_Omni_CreateNewTokenFixed_2113: number;
    MsgType_Core_Omni_CreateNewTokenManaged_2114: number;
    MsgType_Core_Omni_GrantNewUnitsOfManagedToken_2115: number;
    MsgType_Core_Omni_RevokeUnitsOfManagedToken_2116: number;
    MsgType_Core_Omni_ListProperties_2117: number;
    MsgType_Core_Omni_GetTransaction_2118: number;
    MsgType_Core_Omni_GetProperty_2119: number;
    MsgType_Core_Omni_FundingAsset_2120: number;
    MsgType_Core_Omni_Send_2121: number;
    MsgType_Mnemonic_CreateAddress_3000: number;
    MsgType_Mnemonic_GetAddressByIndex_3001: number;
    MsgType_FundingCreate_Asset_AllItem_3100: number;
    MsgType_FundingCreate_Asset_ItemById_3101: number;
    MsgType_FundingCreate_Asset_ItemByChannelId_3102: number;
    MsgType_FundingCreate_Asset_Count_3103: number;
    MsgType_SendChannelOpen_32: number;
    MsgType_RecvChannelOpen_32: number;
    MsgType_SendChannelAccept_33: number;
    MsgType_RecvChannelAccept_33: number;
    MsgType_FundingCreate_SendAssetFundingCreated_34: number;
    MsgType_FundingCreate_RecvAssetFundingCreated_34: number;
    MsgType_FundingSign_SendAssetFundingSigned_35: number;
    MsgType_FundingSign_RecvAssetFundingSigned_35: number;
    MsgType_ClientSign_AssetFunding_AliceSignC1a_1034: number;
    MsgType_ClientSign_AssetFunding_AliceSignRD_1134: number;
    MsgType_ClientSign_Duplex_AssetFunding_RdAndBr_1035: number;
    MsgType_FundingCreate_SendBtcFundingCreated_340: number;
    MsgType_FundingCreate_BtcFundingMinerRDTxToClient_341: number;
    MsgType_FundingCreate_RecvBtcFundingCreated_340: number;
    MsgType_FundingSign_SendBtcSign_350: number;
    MsgType_FundingSign_RecvBtcSign_350: number;
    MsgType_CommitmentTx_SendCommitmentTransactionCreated_351: number;
    MsgType_CommitmentTx_RecvCommitmentTransactionCreated_351: number;
    MsgType_CommitmentTxSigned_SendRevokeAndAcknowledgeCommitmentTransaction_352: number;
    MsgType_CommitmentTxSigned_RecvRevokeAndAcknowledgeCommitmentTransaction_352: number;
    MsgType_ClientSign_BobC2b_Rd_353: number;
    MsgType_ClientSign_CommitmentTx_AliceSignC2a_360: number;
    MsgType_ClientSign_CommitmentTx_BobSignC2b_361: number;
    MsgType_ClientSign_CommitmentTx_AliceSignC2b_362: number;
    MsgType_ClientSign_CommitmentTx_AliceSignC2b_Rd_363: number;
    MsgType_ClientSign_CommitmentTx_BobSignC2b_Rd_364: number;
    MsgType_ChannelOpen_AllItem_3150: number;
    MsgType_ChannelOpen_ItemByTempId_3151: number;
    MsgType_ChannelOpen_Count_3152: number;
    MsgType_ChannelOpen_DelItemByTempId_3153: number;
    MsgType_GetChannelInfoByChannelId_3154: number;
    MsgType_GetChannelInfoByDbId_3155: number;
    MsgType_CheckChannelAddessExist_3156: number;
    MsgType_CommitmentTx_ItemsByChanId_3200: number;
    MsgType_CommitmentTx_ItemById_3201: number;
    MsgType_CommitmentTx_Count_3202: number;
    MsgType_CommitmentTx_LatestCommitmentTxByChanId_3203: number;
    MsgType_CommitmentTx_LatestRDByChanId_3204: number;
    MsgType_CommitmentTx_LatestBRByChanId_3205: number;
    MsgType_CommitmentTx_SendSomeCommitmentById_3206: number;
    MsgType_CommitmentTx_AllRDByChanId_3207: number;
    MsgType_CommitmentTx_AllBRByChanId_3208: number;
    MsgType_SendCloseChannelRequest_38: number;
    MsgType_RecvCloseChannelRequest_38: number;
    MsgType_SendCloseChannelSign_39: number;
    MsgType_RecvCloseChannelSign_39: number;
    MsgType_HTLC_FindPath_401: number;
    MsgType_HTLC_Invoice_402: number;
    MsgType_HTLC_SendAddHTLC_40: number;
    MsgType_HTLC_RecvAddHTLC_40: number;
    MsgType_HTLC_SendAddHTLCSigned_41: number;
    MsgType_HTLC_RecvAddHTLCSigned_41: number;
    MsgType_HTLC_BobSignC3bSubTx_42: number;
    MsgType_HTLC_FinishTransferH_43: number;
    MsgType_HTLC_SendVerifyR_45: number;
    MsgType_HTLC_RecvVerifyR_45: number;
    MsgType_HTLC_SendSignVerifyR_46: number;
    MsgType_HTLC_RecvSignVerifyR_46: number;
    MsgType_HTLC_SendRequestCloseCurrTx_49: number;
    MsgType_HTLC_RecvRequestCloseCurrTx_49: number;
    MsgType_HTLC_SendCloseSigned_50: number;
    MsgType_HTLC_RecvCloseSigned_50: number;
    MsgType_HTLC_Close_ClientSign_Bob_C4bSub_51: number;
    MsgType_HTLC_ClientSign_Alice_C3a_100: number;
    MsgType_HTLC_ClientSign_Bob_C3b_101: number;
    MsgType_HTLC_ClientSign_Alice_C3b_102: number;
    MsgType_HTLC_ClientSign_Alice_C3bSub_103: number;
    MsgType_HTLC_ClientSign_Bob_C3bSub_104: number;
    MsgType_HTLC_ClientSign_Alice_He_105: number;
    MsgType_HTLC_ClientSign_Bob_HeSub_106: number;
    MsgType_HTLC_ClientSign_Alice_HeSub_107: number;
    MsgType_HTLC_Close_ClientSign_Alice_C4a_110: number;
    MsgType_HTLC_Close_ClientSign_Bob_C4b_111: number;
    MsgType_HTLC_Close_ClientSign_Alice_C4b_112: number;
    MsgType_HTLC_Close_ClientSign_Alice_C4bSub_113: number;
    MsgType_HTLC_Close_ClientSign_Bob_C4bSubResult_114: number;
    MsgType_Atomic_SendSwap_80: number;
    MsgType_Atomic_RecvSwap_80: number;
    MsgType_Atomic_SendSwapAccept_81: number;
    MsgType_Atomic_RecvSwapAccept_81: number;
}
