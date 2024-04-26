import { 
    runtimeModule,
    state, 
    runtimeMethod, 
    RuntimeModule 
} from "@proto-kit/module";
import { State, StateMap, assert } from "@proto-kit/protocol";
import { Field, PublicKey } from "o1js";
import { UInt64 } from "@proto-kit/library"

import {SpyInfo, MessageProofPublicOutput } from "./models";
import {ERRORS, CONSTS} from "./consts";
import { MessageProof } from "./messageProof";


@runtimeModule()
export class SecretMessages extends RuntimeModule<unknown> {

    // stored on-chain L2 states 
    @state() public spyDetails  = StateMap.from<Field, SpyInfo>(
        Field, 
        SpyInfo
    );

    // address of the dude that recruits spies, and sets spy secrets
    @state() public spyMaster = State.from<PublicKey>(PublicKey);

    // make a spy master, and only change it if its blank
    @runtimeMethod()
    public setSpyMaster(): void {
        const sender = this.transaction.sender.value;
        const currentSpyMaster = this.spyMaster.get();
        assert(currentSpyMaster.isSome.not(), ERRORS.onlyOneSpyMaster);
        this.spyMaster.set(sender);
    }

    @runtimeMethod()
    public recruitSpy(
        agentId: Field, 
        securityCodeHash: Field
    ): void {
        // make sure the sender is the spy master
        const sender = this.transaction.sender.value;
        const curSpyMaster = this.spyMaster.get();
        assert(curSpyMaster.isSome, ERRORS.thereMustBeASpyMaster);
        assert(curSpyMaster.value.equals(sender), ERRORS.onlySpyMasterCanRecruit);

        // set the spy details
        const spyInfo = new SpyInfo({ 
            lastMessageNumber: CONSTS.INITIAL_MESSAGE_NUMBER, 
            securityCodeHash: securityCodeHash,
            blockHeight: CONSTS.INITIAL_BLOCK_HEGHT,
            transactionSender: CONSTS.EMPTY_ADDRESS,
            sendersNonce: CONSTS.INITIAL_NONCE
        });
        this.spyDetails.set(agentId, spyInfo);
    }

    @runtimeMethod()
    public receiveMessage(
        messageProof: MessageProof
    ){
         
        // STEP 1: verify the proof - this verifies message length, while keeping mesage private
        messageProof.verify()
        const proofOutput = new MessageProofPublicOutput(messageProof.publicOutput);
        
        // STEP 2: make sure agentId exists in the system
        assert(this.spyDetails.get(proofOutput.agentId).isSome, ERRORS.spyNotRecruited);
        
        // STEP 3: make sure that the security code matches the one stored in the state
        const storedSpyDetailsValue = this.spyDetails.get(proofOutput.agentId).value;
        const storedSpyDetails = new SpyInfo(storedSpyDetailsValue);
        assert(proofOutput.secretHash.equals(storedSpyDetails.securityCodeHash), ERRORS.codeMismatch);
    
        // STEP 4 make sure that the message number is greater than the last message number
        assert(proofOutput.messageNumber.greaterThan(storedSpyDetails.lastMessageNumber), ERRORS.messageNumber);

        // STEP 5 update the state with new values - message number, block height, transaction sender, and senders nonce
        storedSpyDetails.lastMessageNumber = proofOutput.messageNumber;
        storedSpyDetails.blockHeight = UInt64.from(this.network.block.height);
        storedSpyDetails.transactionSender = this.transaction.sender.value;
        storedSpyDetails.sendersNonce = UInt64.from(this.transaction.nonce.value);


        // STEP 6 update the StateMap
        this.spyDetails.set(proofOutput.agentId, storedSpyDetails);
    }

}