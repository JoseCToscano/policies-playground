import * as passkeyKit from 'passkey-kit';

declare module 'passkey-kit' {
    export enum SignerStore {
        Temporary = 'temporary',
        Permanent = 'permanent'
    }
} 