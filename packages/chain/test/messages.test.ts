import { TestingAppChain } from "@proto-kit/sdk";
import { Field, PrivateKey } from "o1js";
import { Messages, ERRORS, SpyMessage} from "../src/messages";
import { log } from "@proto-kit/common";

log.setLevel("ERROR");

describe("messages", () => {

  let appChain = TestingAppChain.fromRuntime({
    Messages,
  });
  let messages: Messages;

  appChain.configurePartial({
    Runtime: {
      Messages: {},
      Balances: {},
    },
  });

  const bondPrivateKey = PrivateKey.random();
  const bond = bondPrivateKey.toPublicKey();

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

  const inadequateMessage = new SpyMessage({
    agentId: Field(7),
    messageNumber: Field(1),
    twelveCharacters: Field(12345678901),
    securityCode: Field(69420),
  });

  const tooBigMiessage = new SpyMessage({
    agentId: Field(7),
    messageNumber: Field(1),
    twelveCharacters: Field(1234567890123),
    securityCode: Field(69420),
  });

  beforeAll(async () => {
    await appChain.start();
    appChain.setSigner(bondPrivateKey);
    messages = appChain.runtime.resolve("Messages");
  });


    it("only processes messages for recruited spies", async () => {
      const tx = await appChain.transaction(bond, () => {
        messages.receiveMessage(jamesBondMessage);
      });
  
      await tx.sign();
      await tx.send();
  
      const block = await appChain.produceBlock();

      expect(block?.transactions[0].status.toBoolean()).toBe(false);
      expect(block?.transactions[0].statusMessage).toBe(ERRORS.spyNotRecruited);
    });

    describe("all about a recruited spy", () => {

      beforeAll(async () => {
        const tx = await appChain.transaction(bond, () => {
          messages.recruitSpy(Field(7), Field(69420));
        });
    
        await tx.sign();
        await tx.send();
    
        await appChain.produceBlock();
      });


      it("processes message from a recruited spy", async () => {
        const tx = await appChain.transaction(bond, () => {
          messages.receiveMessage(jamesBondMessage);
        });
    
        await tx.sign();
        await tx.send();
    
        const block = await appChain.produceBlock();

        const agentInfo = await appChain.query.runtime.Messages.spyDetails.get(jamesBondId);

    
        expect(block?.transactions[0].status.toBoolean()).toBe(true);
        expect(agentInfo?.lastMessageNumber).toEqual(Field(1));
      });

      it("does not process message with wrong security code", async () => {
        const tx = await appChain.transaction(bond, () => {
          messages.receiveMessage(badSecurityMessage);
        });
    
        await tx.sign();
        await tx.send();
    
        const block = await appChain.produceBlock();
    
        expect(block?.transactions[0].status.toBoolean()).toBe(false);
        expect(block?.transactions[0].statusMessage).toBe(ERRORS.codeMismatch);
      });

      it("does not process message with inadequate size", async () => {
        const tx = await appChain.transaction(bond, () => {
          messages.receiveMessage(inadequateMessage);
        });
    
        await tx.sign();
        await tx.send();
    
        const block = await appChain.produceBlock();
    
        expect(block?.transactions[0].status.toBoolean()).toBe(false);
        expect(block?.transactions[0].statusMessage).toBe(ERRORS.messageTooShort);
      });

      it("does not process message with too big of a size", async () => {
        const tx = await appChain.transaction(bond, () => {
          messages.receiveMessage(tooBigMiessage);
        });
    
        await tx.sign();
        await tx.send();
    
        const block = await appChain.produceBlock();
    
        expect(block?.transactions[0].status.toBoolean()).toBe(false);
        expect(block?.transactions[0].statusMessage).toBe(ERRORS.messageTooLong);
      });

      it("does not process message with a message number already processed", async () => {
        const tx = await appChain.transaction(bond, () => {
          messages.receiveMessage(jamesBondMessage);
        });
    
        await tx.sign();
        await tx.send();
    
        await appChain.produceBlock();

        const tx2 = await appChain.transaction(bond, () => {
          messages.receiveMessage(jamesBondMessage);
        });

        await tx2.sign();
        await tx2.send();

        const block = await appChain.produceBlock();
        expect(block?.transactions[0].status.toBoolean()).toBe(false);
        expect(block?.transactions[0].statusMessage).toBe(ERRORS.messageNumber);
      });

      it("processes message with a message number greater than the last message number", async () => {
        const tx = await appChain.transaction(bond, () => {
          messages.receiveMessage(jamesBondMessage);
        });
    
        await tx.sign();
        await tx.send();
    
        await appChain.produceBlock();

        const tx2 = await appChain.transaction(bond, () => {
          messages.receiveMessage(jamesBondMessage2);
        });

        await tx2.sign();
        await tx2.send();

        const block = await appChain.produceBlock();
        const agentInfo = await appChain.query.runtime.Messages.spyDetails.get(jamesBondId);
    
        expect(block?.transactions[0].status.toBoolean()).toBe(true);
        expect(agentInfo?.lastMessageNumber).toEqual(Field(2));
      });

    });
  });