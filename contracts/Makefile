install:
	rm -rf target/wasm32-unknown-unknown/release/
	stellar contract build
	stellar contract install --network testnet --wasm target/wasm32-unknown-unknown/release/coffee_sponsor.wasm --source default

bindings:
	stellar contract bindings typescript --network testnet --wasm target/wasm32-unknown-unknown/release/coffee_sponsor.wasm --output-dir ./coffee-sponsor-sdk --overwrite