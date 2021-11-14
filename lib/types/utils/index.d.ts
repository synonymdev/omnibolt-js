import { Result } from "../result";
import { IAddressContent, IGetAddress, ISignP2PKH, ISignP2SH, TAvailableNetworks } from "../types";
import { INetwork } from './networks';
export declare const getNextOmniboltAddress: ({ selectedNetwork, addressIndex, mnemonic, }: {
    selectedNetwork: TAvailableNetworks;
    addressIndex: IAddressContent;
    mnemonic: string;
}) => Promise<Result<IAddressContent>>;
export declare const getAddress: ({ keyPair, network, type, }: IGetAddress) => string;
export declare const getScriptHash: (address?: string, network?: INetwork | string) => string;
export declare const getPrivateKey: ({ addressData, selectedNetwork, mnemonic, }: {
    addressData: IAddressContent;
    selectedNetwork?: TAvailableNetworks | undefined;
    mnemonic: string;
}) => Promise<Result<string>>;
export declare const signP2PKH: ({ txhex, privkey, inputs, selectedNetwork }: ISignP2PKH) => string;
export declare const generateFundingAddress: ({ index, mnemonic, selectedNetwork, }: {
    index: number;
    mnemonic: string;
    selectedNetwork: TAvailableNetworks;
}) => Promise<Result<IAddressContent>>;
export declare const signP2SH: ({ is_first_sign, txhex, pubkey_1, pubkey_2, privkey, inputs, selectedNetwork, }: ISignP2SH) => Promise<string>;
export declare const accMul: (arg1: any, arg2: any) => number;
