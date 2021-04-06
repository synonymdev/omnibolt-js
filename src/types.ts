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

export type TOnChannelOpenAttempt = IOmniboltResponse<IOnChannelOpenAttempt>;

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

export type TOnChannelOpen = IOmniboltResponse<IOnChannelOpen>;

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
  peer_ida: string; //Initiator of the channel
  peer_idb: string; //Recipient of the channel
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

export interface IBitcoinFundingCreated {}

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

export type TOnBitcoinFundingCreated = IOmniboltResponse<IOnBitcoinFundingCreated>;

export interface ISendSignedHex100341 {
  signed_hex: string;
}

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
