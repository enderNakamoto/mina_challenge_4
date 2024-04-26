import { Field, Poseidon, PrivateKey } from "o1js";
import { dummyBase64Proof } from "o1js/dist/node/lib/proof_system";
import { Pickles } from "o1js/dist/node/snarky";

import { TestingAppChain } from "@proto-kit/sdk";
import { log } from "@proto-kit/common";
import { UInt64 } from "@proto-kit/library";

import { SecretMessages } from "../src/secret_messages";
import { SpyInfo, SpyMessage, MessageProofPublicOutput } from "../src/models";
import { CONSTS, ERRORS } from "../src/consts";
import { MessageProof, validateMessage } from "../src/messageProof";

log.setLevel("ERROR");

describe("secret messages", () => {

  let appChain = TestingAppChain.fromRuntime({
    SecretMessages,
  });
  let messages: SecretMessages;

  appChain.configurePartial({
    Runtime: {
      SecretMessages: {},
      Balances: {},
    },
  });

  const bondPrivateKey = PrivateKey.random();
  const bond = bondPrivateKey.toPublicKey();

  const MPrivateKey = PrivateKey.random();
  const M = MPrivateKey.toPublicKey();

  const usurperPrivateKey = PrivateKey.random();
  const usurper = usurperPrivateKey.toPublicKey();

  const jamesBondId = Field(7);

  const jamesBondMessage = new SpyMessage({
    agentId: Field(7),
    messageNumber: Field(1),
    twelveCharacters: Field(123456789012),
    securityCode: Field(69420),
  });

  const jamesBondMessage2 = new SpyMessage({
    agentId: Field(7),
    messageNumber: Field(2),
    twelveCharacters: Field(133333789012),
    securityCode: Field(69420),
  });

  const badSecurityMessage = new SpyMessage({
    agentId: Field(7),
    messageNumber: Field(1),
    twelveCharacters: Field(123456789012),
    securityCode: Field(69421),
  });

  // const inadequateMessage = new SpyMessage({
  //   agentId: Field(7),
  //   messageNumber: Field(1),
  //   twelveCharacters: Field(12345678901),
  //   securityCode: Field(69420),
  // });

  // const tooBigMiessage = new SpyMessage({
  //   agentId: Field(7),
  //   messageNumber: Field(1),
  //   twelveCharacters: Field(1234567890123),
  //   securityCode: Field(69420),
  // });

  async function mockProof(
    publicOutput: MessageProofPublicOutput
  ): Promise<MessageProof> {
    const [, proof] = Pickles.proofOfBase64(await dummyBase64Proof(), 2);

    return new MessageProof({
      proof: proof,
      maxProofsVerified: 2,
      publicInput: undefined,
      publicOutput: publicOutput,
    });
  }

  beforeAll(async () => {
    await appChain.start();
    messages = appChain.runtime.resolve("SecretMessages");
  });

    it("only processes messages for recruited spies", async () => {
      appChain.setSigner(bondPrivateKey);
      const notRecruitedProof  = await mockProof(validateMessage(jamesBondMessage));
      const tx = await appChain.transaction(bond, () => {
        messages.receiveMessage(notRecruitedProof);
      });
  
      await tx.sign();
      await tx.send();
  
      const block = await appChain.produceBlock();

      expect(block?.transactions[0].status.toBoolean()).toBe(false);
      expect(block?.transactions[0].statusMessage).toBe(ERRORS.spyNotRecruited);
    });

    it("can set a spy master when there is none", async () => {
      appChain.setSigner(MPrivateKey);
      const tx = await appChain.transaction(M, () => {
        messages.setSpyMaster();
      });
      
      await tx.sign();
      await tx.send();
  
      const block = await appChain.produceBlock();
      const currentSpyMaster = await appChain.query.runtime.SecretMessages.spyMaster.get();

      expect(block?.transactions[0].status.toBoolean()).toBe(true);
      expect(currentSpyMaster).toMatchObject(M);
    });

    it("cannot set a spy master when there is already one", async () => {
      appChain.setSigner(usurperPrivateKey);
      const tx = await appChain.transaction(usurper, () => {
        messages.setSpyMaster();
      });
      
      await tx.sign();
      await tx.send();
  
      const block = await appChain.produceBlock();
      const currentSpyMaster = await appChain.query.runtime.SecretMessages.spyMaster.get();

      expect(block?.transactions[0].status.toBoolean()).toBe(false);
      expect(block?.transactions[0].statusMessage).toBe(ERRORS.onlyOneSpyMaster);
      expect(currentSpyMaster).toMatchObject(M);
    });

    it("only spy master can recruit", async () => {
      appChain.setSigner(usurperPrivateKey);
      const tx = await appChain.transaction(usurper, () => {
        messages.recruitSpy(Field(7), Field(69420));
      });

      await tx.sign();
      await tx.send();

      const block = await appChain.produceBlock();

      expect(block?.transactions[0].status.toBoolean()).toBe(false);
      expect(block?.transactions[0].statusMessage).toBe(ERRORS.onlySpyMasterCanRecruit);
    });

    describe("all about a recruited spy", () => {

      beforeAll(async () => {
        
        // let M recruit james Bond - only she can recuit, as she is the spy master
        appChain.setSigner(MPrivateKey);
        const recruitedSpyHash = Poseidon.hash([Field(69420)]);
        const tx = await appChain.transaction(M, () => {
          messages.recruitSpy(Field(7), recruitedSpyHash);
        });
    
        await tx.sign();
        await tx.send();
    
        await appChain.produceBlock();

        // all the following actions in the test will be taken by 007
        appChain.setSigner(bondPrivateKey);
      });


      it("processes message from a recruited spy", async () => {
        const bondMessageProof  = await mockProof(validateMessage(jamesBondMessage));
        const tx = await appChain.transaction(bond, () => {
          messages.receiveMessage(bondMessageProof);
        });
    
        await tx.sign();
        await tx.send();
    
        const block = await appChain.produceBlock();

        const agentInfo = await appChain.query.runtime.SecretMessages.spyDetails.get(jamesBondId);

    
        expect(block?.transactions[0].status.toBoolean()).toBe(true);
        expect(agentInfo?.lastMessageNumber).toEqual(Field(1));
      });

      it("does not process message with wrong security code", async () => {
        const badSecurotyProof  = await mockProof(validateMessage(badSecurityMessage));
        const tx = await appChain.transaction(bond, () => {
          messages.receiveMessage(badSecurotyProof);
        });
    
        await tx.sign();
        await tx.send();
    
        const block = await appChain.produceBlock();
    
        expect(block?.transactions[0].status.toBoolean()).toBe(false);
        expect(block?.transactions[0].statusMessage).toBe(ERRORS.codeMismatch);
      });

      // it("does not process message with inadequate size", async () => {
      //   expect(() => {
      //     validateMessage(inadequateMessage);
      //   }).toThrow(ERRORS.messageTooShort);
      // });

      // it("does not process message with too big of a size", async () => {
      //   expect(() => {
      //     validateMessage(tooBigMiessage);
      //   }).toThrow(ERRORS.messageTooLong);
      // });

      it("does not process message with a message number already processed", async () => {
        const bondMessageProof  = await mockProof(validateMessage(jamesBondMessage));
        const tx = await appChain.transaction(bond, () => {
          messages.receiveMessage(bondMessageProof);
        });
    
        await tx.sign();
        await tx.send();
    
        await appChain.produceBlock();

        // sending the proof of the same message again - this should fail
        const tx2 = await appChain.transaction(bond, () => {
          messages.receiveMessage(bondMessageProof);
        });

        await tx2.sign();
        await tx2.send();

        const block = await appChain.produceBlock();
        expect(block?.transactions[0].status.toBoolean()).toBe(false);
        expect(block?.transactions[0].statusMessage).toBe(ERRORS.messageNumber);
      });

      it("processes message with a message number greater than the last message number", async () => {
        const bondMessageProof  = await mockProof(validateMessage(jamesBondMessage));
        const tx = await appChain.transaction(bond, () => {
          messages.receiveMessage(bondMessageProof);
        });
    
        await tx.sign();
        await tx.send();
    
        await appChain.produceBlock();

        const bondMessageProof2 = await mockProof(validateMessage(jamesBondMessage2));
        const tx2 = await appChain.transaction(bond, () => {
          messages.receiveMessage(bondMessageProof2);
        });

        await tx2.sign();
        await tx2.send();

        const block = await appChain.produceBlock();
        const agentInfo = await appChain.query.runtime.SecretMessages.spyDetails.get(jamesBondId);
    
        expect(block?.transactions[0].status.toBoolean()).toBe(true);
        expect(agentInfo?.lastMessageNumber).toEqual(Field(2));
      });

    });
  });