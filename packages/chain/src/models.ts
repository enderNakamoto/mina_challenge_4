
import { Field, PublicKey, Struct } from "o1js";
import { UInt64 } from "@proto-kit/library"

// this is the incoming messages
export class SpyMessage extends Struct({
    agentId: Field, 
    messageNumber: Field,
    twelveCharacters: Field, 
    securityCode: Field,
    }) {}

// this is what is stored in the state
export class SpyInfo extends Struct({
    lastMessageNumber: Field,
    securityCodeHash: Field,
    blockHeight: UInt64,
    transactionSender: PublicKey,
    sendersNonce: UInt64
}) {}

export class MessageProofPublicOutput extends Struct({
    agentId: Field,
    secretHash: Field,
    messageNumber: Field
}) {}