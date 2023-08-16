# Example Canister

## Running the project locally

Make sure [the IC SDK](https://internetcomputer.org/docs/current/developer-docs/setup/install/) is installed on your machine. Then run:

```bash
# Starts the replica, running in the background
dfx start --background

# Creates a minter account
dfx identity new minter

# Switches back to your default account
dfx identity use default

# Installs the ledger canister with a fixed id, sets the minter account as minter and current (default) identity as the canister's controller 
dfx canister create ledger --specified-id ryjl3-tyaaa-aaaaa-aaaba-cai
dfx build ledger
dfx canister install ledger --argument "(variant {Init = record { token_name = \"DEV\"; token_symbol = \"DEV\"; transfer_fee = 100; metadata = vec {}; minting_account = record {owner = principal \"$(dfx --identity minter identity get-principal)\";}; initial_balances = vec {}; archive_options = record {num_blocks_to_archive = 1000000; trigger_threshold = 1000000; controller_id = principal \"$(dfx identity get-principal)\"}; }})"

# Creates icrc21_backend canister with a fixed id
dfx canister create icrc21_backend --specified-id bkyz2-fmaaa-aaaaa-qaaaq-cai

# Deploys all canisters to the replica and generates the candid interface
dfx deploy
```

Once the job completes, your application will be available at `http://localhost:4943?canisterId={asset_canister_id}`.

If you have made changes to your backend canister, you can generate a new candid interface with

```bash
npm run generate
```

at any time. This is recommended before starting the frontend development server, and will be run automatically any time you run `dfx deploy`.

If you are making frontend changes, you can start a development server with

```bash
npm start
```

Which will start a server at `http://localhost:8080`, proxying API requests to the replica at port 4943.

### Note on frontend environment variables

If you are hosting frontend code somewhere without using DFX, you may need to make one of the following adjustments to ensure your project does not fetch the root key in production:

- set`DFX_NETWORK` to `production` if you are using Webpack
- use your own preferred method to replace `process.env.DFX_NETWORK` in the autogenerated declarations
  - Setting `canisters -> {asset_canister_id} -> declarations -> env_override to a string` in `dfx.json` will replace `process.env.DFX_NETWORK` with the string in the autogenerated declarations
- Write your own `createActor` constructor