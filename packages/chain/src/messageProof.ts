import { 
    Poseidon,
    Experimental
 } from 'o1js';

import {CONSTS, ERRORS} from './consts';
import { MessageProofPublicOutput, SpyMessage } from "./models";

export function validateMessage(
  spyMessage: SpyMessage
): MessageProofPublicOutput {

    const incomingMessage = spyMessage.twelveCharacters;

    // STEP 1: make sure message is 12 characters long
    incomingMessage.assertGreaterThanOrEqual(CONSTS.LOWER_LIMIT, ERRORS.messageTooShort);
    incomingMessage.assertLessThanOrEqual(CONSTS.UPPER_LIMIT, ERRORS.messageTooLong);

    // STEP 2: return the message number and the hash of the message
    const secretHash = Poseidon.hash([spyMessage.securityCode]);
    return new MessageProofPublicOutput({
      agentId: spyMessage.agentId,  
      secretHash: secretHash,
      messageNumber: spyMessage.messageNumber
    });
  };
 
  export const messageValidator = Experimental.ZkProgram({
    key: 'message-validator',
    publicOutput: MessageProofPublicOutput,

    methods: {
      verifyUserInputs: {
        privateInputs: [SpyMessage],
        method: validateMessage,
      },
    },
  });

  export let MessageProof_ = Experimental.ZkProgram.Proof(messageValidator);
  export class MessageProof extends MessageProof_ {}