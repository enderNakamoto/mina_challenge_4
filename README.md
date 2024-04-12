# This is Mina Challenge 3, based on the Protokit Starter Kit 

The runtime for the mina challenge is in the file `packages/chain/src/messages.ts`

You can run the tests by running: 

` pnpm run test --filter=chain`

The test file is in `packages/chain/test/messages.test.ts`

You should see an test output like: 

![alt text](image.png)


# Spy Master is worried about Privacy - Is he correct? 

Yes, the messages are all being processed on-chain, they are NOT private. Everyone can read the messages. All the messages are Public inputs! 

To solve it, we need to move the processing of messages off-chain. We can use a ZKProgram to let spies make off-chain private inputs from their local machine, and then verify the ZK program on-chain, after processing the messages off-chain as well.

This will also make the security code more secure. Right now, all the secutity codes are public too! 

In the beginning, the spy recruiting part can also be done off-chain , so the security code for a specific spy will only be known by the guy recruiting the spy ( Spy Master). Spies with security codes can now do off-chain processing and submit the proof on-chain.