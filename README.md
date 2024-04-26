# This is Mina Challenge 4, based on the Protokit Starter Kit 

The runtime for the mina challenge is in the file `packages/chain/src/secret_messages.ts`

You can run the tests by running: 

` pnpm run test --filter=chain`

The test file is in `packages/chain/test/secret_messages.test.ts`

You should see an test output like: 


# Privacy 

The zk Program and the proof that keeps message secret is in `packages/chain/src/messageProof.ts`

The proof is used as an argument in runtime method, which proves that the message was indeed 12 characters long. 

We also only store hash of the agent secret in rollup state -therefore, both the message and the agent secret is private! 

the secret hash of the agent is passed to runtime module via the publicoutputput of the ZkProgram Proof, and then that hash is compared against stored state..