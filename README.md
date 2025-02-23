# Solidy-scripting

## Usage

### Installing openzeppelin & solmate libraries 

````shell
forge install transmissions11/solmate Openzeppelin/openzeppelin-contracts
````

### Fetching with recursion

```shell
git fetch --recurse-submodules
```

### To load the variables in the .env file

```shell
source .env
```

### Main Script for Deployment

```shell
$ node script/main.js deploy -cn <collectionName>
```

### Mint

```shell
$ forge script --chain sepolia --rpc-url $SEPOLIA_RPC_URL --broadcast --verify -vvvv script/MultiToken.s.sol:MultiTokenScript  --sig "mint(address deployedContractAddress, address mintTo, uint256[] memory ids, uint256[] memory amounts, bytes memory data)" <deployedContractAddress> <mintTo> <ids []> <amounts []> <data>
```