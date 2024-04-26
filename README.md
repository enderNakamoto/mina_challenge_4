# This is Mina Challenge 3, based on the Protokit Starter Kit 

The runtime for the mina challenge is in the file `packages/chain/src/secret_messages.ts`

The zk Program and the proof that keeps message secret is in `packages/chain/src/messageProof.ts`

The proof is used as an argument in runtime method, which proves that the message was indeed 12 characters long. 

We also only store hash of the agent secret in rollup state -therefore, both the message and the agent secret is private! 

the secret hash of the agent is passed to runtime module via the publicoutputput of the ZkProgram Proof, and then that hash is compared against stored state.

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