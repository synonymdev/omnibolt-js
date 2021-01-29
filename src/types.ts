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
