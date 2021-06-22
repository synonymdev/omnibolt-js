"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageType = exports.P2PPeer = exports.AtomicSwapAccepted = exports.AtomicSwapRequest = exports.CloseChannelSign = exports.OmniSendRevoke = exports.OmniSendGrant = exports.IssueFixedAmountInfo = exports.IssueManagedAmoutInfo = exports.CloseHtlcTxInfoSigned = exports.CloseHtlcTxInfo = exports.SignRInfo = exports.ForwardRInfo = exports.HtlcRequestOpen = exports.SignGetHInfo = exports.HtlcSignedInfo = exports.addHTLCInfo = exports.HTLCFindPathInfo = exports.InvoiceInfo = exports.CommitmentTxSigned = exports.CommitmentTx = exports.SignedInfo100114 = exports.SignedInfo100113 = exports.SignedInfo100112 = exports.SignedInfo100111 = exports.SignedInfo100110 = exports.SignedInfo100106 = exports.SignedInfo100105 = exports.SignedInfo100104 = exports.SignedInfo100103 = exports.SignedInfo100102 = exports.SignedInfo100101 = exports.SignedInfo100100 = exports.SignedInfo100364 = exports.SignedInfo100363 = exports.SignedInfo100362 = exports.SignedInfo100361 = exports.SignedInfo100360 = exports.SignedInfo101134 = exports.SignedInfo101035 = exports.AssetFundingSignedInfo = exports.AssetFundingCreatedInfo = exports.AcceptChannelInfo = exports.OpenChannelInfo = exports.OmniSendAssetInfo = exports.OmniFundingAssetInfo = exports.FundingBtcSigned = exports.FundingBtcCreated = exports.BtcFundingInfo = exports.Message = void 0;
class Message {
    type = 0;
    data = {};
    recipient_user_peer_id = "";
    recipient_node_peer_id = "";
}
exports.Message = Message;
class BtcFundingInfo {
    from_address = "";
    to_address = "";
    amount = 0.0;
    miner_fee = 0.0;
}
exports.BtcFundingInfo = BtcFundingInfo;
class FundingBtcCreated {
    temporary_channel_id = "";
    funding_tx_hex = "";
}
exports.FundingBtcCreated = FundingBtcCreated;
class FundingBtcSigned {
    temporary_channel_id = "";
    funding_txid = "";
    signed_miner_redeem_transaction_hex = "";
    approval = false;
}
exports.FundingBtcSigned = FundingBtcSigned;
class OmniFundingAssetInfo {
    from_address = "";
    to_address = "";
    property_id = 0;
    amount = 0;
    miner_fee = 0.0;
}
exports.OmniFundingAssetInfo = OmniFundingAssetInfo;
class OmniSendAssetInfo {
    from_address = "";
    to_address = "";
    property_id = 0;
    amount = 0;
}
exports.OmniSendAssetInfo = OmniSendAssetInfo;
class OpenChannelInfo {
    funding_pubkey = "";
    is_private = false;
}
exports.OpenChannelInfo = OpenChannelInfo;
class AcceptChannelInfo {
    temporary_channel_id = "";
    funding_pubkey = "";
    approval = false;
}
exports.AcceptChannelInfo = AcceptChannelInfo;
class AssetFundingCreatedInfo {
    temporary_channel_id = "";
    funding_tx_hex = "";
    temp_address_pub_key = "";
    temp_address_index = 0;
}
exports.AssetFundingCreatedInfo = AssetFundingCreatedInfo;
class AssetFundingSignedInfo {
    temporary_channel_id = "";
    signed_alice_rsmc_hex = "";
}
exports.AssetFundingSignedInfo = AssetFundingSignedInfo;
class SignedInfo101035 {
    temporary_channel_id = "";
    rd_signed_hex = "";
    br_signed_hex = "";
    br_id = 0;
}
exports.SignedInfo101035 = SignedInfo101035;
class SignedInfo101134 {
    channel_id = "";
    rd_signed_hex = "";
}
exports.SignedInfo101134 = SignedInfo101134;
class SignedInfo100360 {
    channel_id = "";
    rsmc_signed_hex = "";
    counterparty_signed_hex = "";
}
exports.SignedInfo100360 = SignedInfo100360;
class SignedInfo100361 {
    channel_id = "";
    c2b_rsmc_signed_hex = "";
    c2b_counterparty_signed_hex = "";
    c2a_rd_signed_hex = "";
    c2a_br_signed_hex = "";
    c2a_br_id = 0;
}
exports.SignedInfo100361 = SignedInfo100361;
class SignedInfo100362 {
    channel_id = "";
    c2b_rsmc_signed_hex = "";
    c2b_counterparty_signed_hex = "";
    c2a_rd_signed_hex = "";
}
exports.SignedInfo100362 = SignedInfo100362;
class SignedInfo100363 {
    channel_id = "";
    c2b_rd_signed_hex = "";
    c2b_br_signed_hex = "";
    c2b_br_id = 0;
}
exports.SignedInfo100363 = SignedInfo100363;
class SignedInfo100364 {
    channel_id = "";
    c2b_rd_signed_hex = "";
}
exports.SignedInfo100364 = SignedInfo100364;
class SignedInfo100100 {
    channel_id = "";
    c3a_counterparty_partial_signed_hex = "";
    c3a_htlc_partial_signed_hex = "";
    c3a_rsmc_partial_signed_hex = "";
}
exports.SignedInfo100100 = SignedInfo100100;
class SignedInfo100101 {
    channel_id = "";
    c3a_rsmc_rd_partial_signed_hex = "";
    c3a_rsmc_br_partial_signed_hex = "";
    c3a_htlc_ht_partial_signed_hex = "";
    c3a_htlc_hlock_partial_signed_hex = "";
    c3a_htlc_br_partial_signed_hex = "";
    c3b_rsmc_partial_signed_hex = "";
    c3b_counterparty_partial_signed_hex = "";
    c3b_htlc_partial_signed_hex = "";
}
exports.SignedInfo100101 = SignedInfo100101;
class SignedInfo100102 {
    channel_id = "";
    c3a_rsmc_rd_complete_signed_hex = "";
    c3a_htlc_ht_complete_signed_hex = "";
    c3a_htlc_hlock_complete_signed_hex = "";
    c3b_rsmc_complete_signed_hex = "";
    c3b_counterparty_complete_signed_hex = "";
    c3b_htlc_complete_signed_hex = "";
}
exports.SignedInfo100102 = SignedInfo100102;
class SignedInfo100103 {
    channel_id = "";
    c3a_htlc_htrd_partial_signed_hex = "";
    c3b_rsmc_rd_partial_signed_hex = "";
    c3b_rsmc_br_partial_signed_hex = "";
    c3b_htlc_htd_partial_signed_hex = "";
    c3b_htlc_hlock_partial_signed_hex = "";
    c3b_htlc_br_partial_signed_hex = "";
}
exports.SignedInfo100103 = SignedInfo100103;
class SignedInfo100104 {
    channel_id = "";
    curr_htlc_temp_address_for_he_pub_key = "";
    curr_htlc_temp_address_for_he_index = 0;
    c3a_htlc_htrd_complete_signed_hex = "";
    c3a_htlc_htbr_partial_signed_hex = "";
    c3a_htlc_hed_partial_signed_hex = "";
    c3b_rsmc_rd_complete_signed_hex = "";
    c3b_htlc_htd_complete_signed_hex = "";
    c3b_htlc_hlock_complete_signed_hex = "";
}
exports.SignedInfo100104 = SignedInfo100104;
class SignedInfo100105 {
    channel_id = "";
    c3b_htlc_hlock_he_partial_signed_hex = "";
}
exports.SignedInfo100105 = SignedInfo100105;
class SignedInfo100106 {
    channel_id = "";
    c3b_htlc_herd_partial_signed_hex = "";
}
exports.SignedInfo100106 = SignedInfo100106;
class SignedInfo100110 {
    channel_id = "";
    counterparty_partial_signed_hex = "";
    rsmc_partial_signed_hex = "";
}
exports.SignedInfo100110 = SignedInfo100110;
class SignedInfo100111 {
    channel_id = "";
    c4a_rd_signed_hex = "";
    c4a_br_signed_hex = "";
    c4a_br_id = "";
    c4b_rsmc_signed_hex = "";
    c4b_counterparty_signed_hex = "";
}
exports.SignedInfo100111 = SignedInfo100111;
class SignedInfo100112 {
    channel_id = "";
    c4a_rd_complete_signed_hex = "";
    c4b_rsmc_complete_signed_hex = "";
    c4b_counterparty_complete_signed_hex = "";
}
exports.SignedInfo100112 = SignedInfo100112;
class SignedInfo100113 {
    channel_id = "";
    c4b_rd_partial_signed_hex = "";
    c4b_br_partial_signed_hex = "";
    c4b_br_id = "";
}
exports.SignedInfo100113 = SignedInfo100113;
class SignedInfo100114 {
    channel_id = "";
    c4b_rd_complete_signed_hex = "";
}
exports.SignedInfo100114 = SignedInfo100114;
class CommitmentTx {
    channel_id = "";
    amount = 0;
    curr_temp_address_pub_key = "";
    curr_temp_address_index = 0;
    last_temp_address_private_key = "";
}
exports.CommitmentTx = CommitmentTx;
class CommitmentTxSigned {
    channel_id = "";
    msg_hash = "";
    c2a_rsmc_signed_hex = "";
    c2a_counterparty_signed_hex = "";
    curr_temp_address_pub_key = "";
    curr_temp_address_index = 0;
    last_temp_address_private_key = "";
    approval = false;
}
exports.CommitmentTxSigned = CommitmentTxSigned;
class InvoiceInfo {
    property_id = 0;
    amount = 0;
    h = "";
    expiry_time = "";
    description = "";
    is_private = false;
}
exports.InvoiceInfo = InvoiceInfo;
class HTLCFindPathInfo extends InvoiceInfo {
    invoice = "";
    recipient_node_peer_id = "";
    recipient_user_peer_id = "";
    is_inv_pay = false;
}
exports.HTLCFindPathInfo = HTLCFindPathInfo;
class addHTLCInfo {
    recipient_user_peer_id = "";
    property_id = 0;
    amount = 0;
    memo = "";
    h = "";
    routing_packet = "";
    cltv_expiry = 0;
    last_temp_address_private_key = "";
    curr_rsmc_temp_address_pub_key = "";
    curr_rsmc_temp_address_index = 0;
    curr_htlc_temp_address_pub_key = "";
    curr_htlc_temp_address_index = 0;
    curr_htlc_temp_address_for_ht1a_pub_key = "";
    curr_htlc_temp_address_for_ht1a_index = 0;
}
exports.addHTLCInfo = addHTLCInfo;
class HtlcSignedInfo {
    payer_commitment_tx_hash = "";
    curr_rsmc_temp_address_pub_key = "";
    curr_rsmc_temp_address_index = 0;
    curr_htlc_temp_address_pub_key = "";
    curr_htlc_temp_address_index = 0;
    last_temp_address_private_key = "";
    c3a_complete_signed_rsmc_hex = "";
    c3a_complete_signed_counterparty_hex = "";
    c3a_complete_signed_htlc_hex = "";
}
exports.HtlcSignedInfo = HtlcSignedInfo;
class SignGetHInfo {
    request_hash = "";
    channel_address_private_key = "";
    last_temp_address_private_key = "";
    curr_rsmc_temp_address_pub_key = "";
    curr_rsmc_temp_address_private_key = "";
    curr_htlc_temp_address_pub_key = "";
    curr_htlc_temp_address_private_key = "";
    approval = false;
}
exports.SignGetHInfo = SignGetHInfo;
class HtlcRequestOpen {
    request_hash = "";
    channel_address_private_key = "";
    last_temp_address_private_key = "";
    curr_rsmc_temp_address_pub_key = "";
    curr_rsmc_temp_address_private_key = "";
    curr_htlc_temp_address_pub_key = "";
    curr_htlc_temp_address_private_key = "";
    curr_htlc_temp_address_for_ht1a_pub_key = "";
    curr_htlc_temp_address_for_ht1a_private_key = "";
}
exports.HtlcRequestOpen = HtlcRequestOpen;
class ForwardRInfo {
    channel_id = "";
    r = "";
}
exports.ForwardRInfo = ForwardRInfo;
class SignRInfo {
    channel_id = "";
    c3b_htlc_herd_complete_signed_hex = "";
    c3b_htlc_hebr_partial_signed_hex = "";
}
exports.SignRInfo = SignRInfo;
class CloseHtlcTxInfo {
    channel_id = "";
    last_rsmc_temp_address_private_key = "";
    last_htlc_temp_address_private_key = "";
    last_htlc_temp_address_for_htnx_private_key = "";
    curr_temp_address_pub_key = "";
    curr_temp_address_index = 0;
}
exports.CloseHtlcTxInfo = CloseHtlcTxInfo;
class CloseHtlcTxInfoSigned {
    msg_hash = "";
    last_rsmc_temp_address_private_key = "";
    last_htlc_temp_address_private_key = "";
    last_htlc_temp_address_for_htnx_private_key = "";
    curr_temp_address_pub_key = "";
    curr_temp_address_index = 0;
}
exports.CloseHtlcTxInfoSigned = CloseHtlcTxInfoSigned;
class IssueManagedAmoutInfo {
    from_address = "";
    name = "";
    ecosystem = 0;
    divisible_type = 0;
    data = "";
}
exports.IssueManagedAmoutInfo = IssueManagedAmoutInfo;
class IssueFixedAmountInfo extends IssueManagedAmoutInfo {
    amount = 0;
}
exports.IssueFixedAmountInfo = IssueFixedAmountInfo;
class OmniSendGrant {
    from_address = "";
    property_id = 0;
    amount = 0;
    memo = "";
}
exports.OmniSendGrant = OmniSendGrant;
class OmniSendRevoke extends OmniSendGrant {
}
exports.OmniSendRevoke = OmniSendRevoke;
class CloseChannelSign {
    channel_id = "";
    request_close_channel_hash = "";
    approval = false;
}
exports.CloseChannelSign = CloseChannelSign;
class AtomicSwapRequest {
    channel_id_from = "";
    channel_id_to = "";
    recipient_user_peer_id = "";
    property_sent = 0;
    amount = 0;
    exchange_rate = 0;
    property_received = 0;
    transaction_id = "";
    time_locker = 0;
}
exports.AtomicSwapRequest = AtomicSwapRequest;
class AtomicSwapAccepted extends AtomicSwapRequest {
    target_transaction_id = "";
}
exports.AtomicSwapAccepted = AtomicSwapAccepted;
class P2PPeer {
    remote_node_address = "";
}
exports.P2PPeer = P2PPeer;
class MessageType {
    MsgType_Error_0 = 0;
    MsgType_UserLogin_2001 = -102001;
    MsgType_UserLogout_2002 = -102002;
    MsgType_p2p_ConnectPeer_2003 = -102003;
    MsgType_GetMnemonic_2004 = -102004;
    MsgType_GetMiniBtcFundAmount_2006 = -102006;
    MsgType_Core_GetNewAddress_2101 = -102101;
    MsgType_Core_GetMiningInfo_2102 = -102102;
    MsgType_Core_GetNetworkInfo_2103 = -102103;
    MsgType_Core_SignMessageWithPrivKey_2104 = -102104;
    MsgType_Core_VerifyMessage_2105 = -102105;
    MsgType_Core_DumpPrivKey_2106 = -102106;
    MsgType_Core_ListUnspent_2107 = -102107;
    MsgType_Core_BalanceByAddress_2108 = -102108;
    MsgType_Core_FundingBTC_2109 = -102109;
    MsgType_Core_BtcCreateMultiSig_2110 = -102110;
    MsgType_Core_Btc_ImportPrivKey_2111 = -102111;
    MsgType_Core_Omni_Getbalance_2112 = -102112;
    MsgType_Core_Omni_CreateNewTokenFixed_2113 = -102113;
    MsgType_Core_Omni_CreateNewTokenManaged_2114 = -102114;
    MsgType_Core_Omni_GrantNewUnitsOfManagedToken_2115 = -102115;
    MsgType_Core_Omni_RevokeUnitsOfManagedToken_2116 = -102116;
    MsgType_Core_Omni_ListProperties_2117 = -102117;
    MsgType_Core_Omni_GetTransaction_2118 = -102118;
    MsgType_Core_Omni_GetProperty_2119 = -102119;
    MsgType_Core_Omni_FundingAsset_2120 = -102120;
    MsgType_Core_Omni_Send_2121 = -102121;
    MsgType_Mnemonic_CreateAddress_3000 = -103000;
    MsgType_Mnemonic_GetAddressByIndex_3001 = -103001;
    MsgType_FundingCreate_Asset_AllItem_3100 = -103100;
    MsgType_FundingCreate_Asset_ItemById_3101 = -103101;
    MsgType_FundingCreate_Asset_ItemByChannelId_3102 = -103102;
    MsgType_FundingCreate_Asset_Count_3103 = -103103;
    MsgType_SendChannelOpen_32 = -100032;
    MsgType_RecvChannelOpen_32 = -110032;
    MsgType_SendChannelAccept_33 = -100033;
    MsgType_RecvChannelAccept_33 = -110033;
    MsgType_FundingCreate_SendAssetFundingCreated_34 = -100034;
    MsgType_FundingCreate_RecvAssetFundingCreated_34 = -110034;
    MsgType_FundingSign_SendAssetFundingSigned_35 = -100035;
    MsgType_FundingSign_RecvAssetFundingSigned_35 = -110035;
    MsgType_ClientSign_AssetFunding_AliceSignC1a_1034 = -101034;
    MsgType_ClientSign_AssetFunding_AliceSignRD_1134 = -101134;
    MsgType_ClientSign_Duplex_AssetFunding_RdAndBr_1035 = -101035;
    MsgType_FundingCreate_SendBtcFundingCreated_340 = -100340;
    MsgType_FundingCreate_BtcFundingMinerRDTxToClient_341 = -100341;
    MsgType_FundingCreate_RecvBtcFundingCreated_340 = -110340;
    MsgType_FundingSign_SendBtcSign_350 = -100350;
    MsgType_FundingSign_RecvBtcSign_350 = -110350;
    MsgType_CommitmentTx_SendCommitmentTransactionCreated_351 = -100351;
    MsgType_CommitmentTx_RecvCommitmentTransactionCreated_351 = -110351;
    MsgType_CommitmentTxSigned_SendRevokeAndAcknowledgeCommitmentTransaction_352 = -100352;
    MsgType_CommitmentTxSigned_RecvRevokeAndAcknowledgeCommitmentTransaction_352 = -110352;
    MsgType_ClientSign_BobC2b_Rd_353 = -110353;
    MsgType_ClientSign_CommitmentTx_AliceSignC2a_360 = -100360;
    MsgType_ClientSign_CommitmentTx_BobSignC2b_361 = -100361;
    MsgType_ClientSign_CommitmentTx_AliceSignC2b_362 = -100362;
    MsgType_ClientSign_CommitmentTx_AliceSignC2b_Rd_363 = -100363;
    MsgType_ClientSign_CommitmentTx_BobSignC2b_Rd_364 = -100364;
    MsgType_ChannelOpen_AllItem_3150 = -103150;
    MsgType_ChannelOpen_ItemByTempId_3151 = -103151;
    MsgType_ChannelOpen_Count_3152 = -103152;
    MsgType_ChannelOpen_DelItemByTempId_3153 = -103153;
    MsgType_GetChannelInfoByChannelId_3154 = -103154;
    MsgType_GetChannelInfoByDbId_3155 = -103155;
    MsgType_CheckChannelAddessExist_3156 = -103156;
    MsgType_CommitmentTx_ItemsByChanId_3200 = -103200;
    MsgType_CommitmentTx_ItemById_3201 = -103201;
    MsgType_CommitmentTx_Count_3202 = -103202;
    MsgType_CommitmentTx_LatestCommitmentTxByChanId_3203 = -103203;
    MsgType_CommitmentTx_LatestRDByChanId_3204 = -103204;
    MsgType_CommitmentTx_LatestBRByChanId_3205 = -103205;
    MsgType_CommitmentTx_SendSomeCommitmentById_3206 = -103206;
    MsgType_CommitmentTx_AllRDByChanId_3207 = -103207;
    MsgType_CommitmentTx_AllBRByChanId_3208 = -103208;
    MsgType_SendCloseChannelRequest_38 = -100038;
    MsgType_RecvCloseChannelRequest_38 = -110038;
    MsgType_SendCloseChannelSign_39 = -100039;
    MsgType_RecvCloseChannelSign_39 = -110039;
    MsgType_HTLC_FindPath_401 = -100401;
    MsgType_HTLC_Invoice_402 = -100402;
    MsgType_HTLC_SendAddHTLC_40 = -100040;
    MsgType_HTLC_RecvAddHTLC_40 = -110040;
    MsgType_HTLC_SendAddHTLCSigned_41 = -100041;
    MsgType_HTLC_RecvAddHTLCSigned_41 = -110041;
    MsgType_HTLC_BobSignC3bSubTx_42 = -110042;
    MsgType_HTLC_FinishTransferH_43 = -110043;
    MsgType_HTLC_SendVerifyR_45 = -100045;
    MsgType_HTLC_RecvVerifyR_45 = -110045;
    MsgType_HTLC_SendSignVerifyR_46 = -100046;
    MsgType_HTLC_RecvSignVerifyR_46 = -110046;
    MsgType_HTLC_SendRequestCloseCurrTx_49 = -100049;
    MsgType_HTLC_RecvRequestCloseCurrTx_49 = -110049;
    MsgType_HTLC_SendCloseSigned_50 = -100050;
    MsgType_HTLC_RecvCloseSigned_50 = -110050;
    MsgType_HTLC_Close_ClientSign_Bob_C4bSub_51 = -110051;
    MsgType_HTLC_ClientSign_Alice_C3a_100 = -100100;
    MsgType_HTLC_ClientSign_Bob_C3b_101 = -100101;
    MsgType_HTLC_ClientSign_Alice_C3b_102 = -100102;
    MsgType_HTLC_ClientSign_Alice_C3bSub_103 = -100103;
    MsgType_HTLC_ClientSign_Bob_C3bSub_104 = -100104;
    MsgType_HTLC_ClientSign_Alice_He_105 = -100105;
    MsgType_HTLC_ClientSign_Bob_HeSub_106 = -100106;
    MsgType_HTLC_ClientSign_Alice_HeSub_107 = -100107;
    MsgType_HTLC_Close_ClientSign_Alice_C4a_110 = -100110;
    MsgType_HTLC_Close_ClientSign_Bob_C4b_111 = -100111;
    MsgType_HTLC_Close_ClientSign_Alice_C4b_112 = -100112;
    MsgType_HTLC_Close_ClientSign_Alice_C4bSub_113 = -100113;
    MsgType_HTLC_Close_ClientSign_Bob_C4bSubResult_114 = -100114;
    MsgType_Atomic_SendSwap_80 = -100080;
    MsgType_Atomic_RecvSwap_80 = -110080;
    MsgType_Atomic_SendSwapAccept_81 = -100081;
    MsgType_Atomic_RecvSwapAccept_81 = -110081;
}
exports.MessageType = MessageType;
