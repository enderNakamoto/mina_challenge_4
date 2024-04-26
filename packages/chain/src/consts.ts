import { Field, PublicKey } from "o1js";
import { UInt64 } from "@proto-kit/library"

export const CONSTS = {
    LOWER_LIMIT: Field(100000000000),
    UPPER_LIMIT: Field(999999999999),
    INITIAL_MESSAGE_NUMBER: Field(0),
    INITIAL_NONCE: UInt64.from(0),
    EMPTY_ADDRESS: PublicKey.empty(),
    INITIAL_BLOCK_HEGHT: UInt64.from(0)
};

export const ERRORS = {
    spyNotRecruited: "Spy not recruited yet, no spy with that id has been initialized",
    codeMismatch: "Security code hash does not match",
    messageTooShort: "Message is less than 12 characters long",
    messageTooLong: "Message is more than 12 characters long",
    messageNumber: "Message number is not greater than the last message number"
  };