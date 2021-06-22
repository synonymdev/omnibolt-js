export declare type TAvailableNetworks = 'bitcoin' | 'bitcoinTestnet';
export declare enum EAvailableNetworks {
    bitcoin = "bitcoin",
    bitcoinTestnet = "bitcoinTestnet"
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
export declare type INetworks = {
    [key in EAvailableNetworks]: INetwork;
};
export declare const networks: INetworks;
export declare const availableNetworks: () => EAvailableNetworks[];
