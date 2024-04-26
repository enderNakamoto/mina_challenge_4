import { Field } from "o1js";
import { log } from "@proto-kit/common";

import { validateMessage } from "../src/messageProof";
import { ERRORS } from "../src/consts";
import { SpyMessage } from "../src/models";

log.setLevel("ERROR");

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

describe("message validator unit tests", () => {
    it("does not process message with inadequate size", async () => {
        expect(() => {
          validateMessage(inadequateMessage);
        }).toThrow(ERRORS.messageTooShort);
      });

      it("does not process message with too big of a size", async () => {
        expect(() => {
          validateMessage(tooBigMiessage);
        }).toThrow(ERRORS.messageTooLong);
      });
});