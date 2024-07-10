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

### Deploy

```shell
$ forge script --chain sepolia --rpc-url $SEPOLIA_RPC_URL --broadcast --verify -vvvv script/MultiToken.s.sol:MultiTokenScript  --sig "deploy(string memory _baseURI, string memory _contractMetedataURI, string memory _name, string memory _symbol)" <_baseURI> <_contractMetedataURI> <_name> <_symbol>
```

### Mint

```shell
$ forge script --chain sepolia --rpc-url $SEPOLIA_RPC_URL --broadcast --verify -vvvv script/MultiToken.s.sol:MultiTokenScript  --sig "mint(address deployedContractAddress, address mintTo, uint256[] memory ids, uint256[] memory amounts, bytes memory data)" <deployedContractAddress> <mintTo> <ids []> <amounts []> <data>
```
