# ICRC-25 PoC

## Run

1. Initialize the project and build Beacon dependencies
```bash
$ npm install
```

2. Navigate to the `examples/ic` directory
```bash
$ cd examples/ic
```

3. Run the canister

Make sure [the IC SDK](https://internetcomputer.org/docs/current/developer-docs/setup/install/) is installed on your machine. Then run:
```bash
$ cd canister
$ ./run # runs a local replica and deploys example canister
$ cd ..
```

4. Run the dapp
```bash
$ cd dapp
$ npm install
$ npm start
# open localhost:3000 in your browser
```

5. Run the wallet
```bash
$ cd wallet
$ npm install
$ npm start
# open localhost:3001 in your browser
```

## Use

1. Open the wallet and import an account by pasting a BIP-39 mnemonic into the import account text area and click the `Import Account` button.
2. Click the `Mint` button to mint some tokens for the imported account.
3. Open the dapp and click the `Request Permission` button and copy the sync QR code.
4. Return to the wallet and paste the sync code by clicking the `Paste Sync Code` button.
5. Accept the permission request.
6. To request a transfer go to the dapp, provide the recipient's principal and the amount to send an click `Send`.
7. In the wallet wait for the consent message to show then accept it.
8. Navigate back to the dapp and observe the response.