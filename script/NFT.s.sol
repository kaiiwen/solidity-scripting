// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Script.sol";
import "../src/NFT.sol";

contract NFTScript is Script {
    function run(
        string memory _name,
        string memory _symbol,
        string memory _baseURI
    ) external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        new NFT(_name, _symbol, _baseURI);

        vm.stopBroadcast();
    }
}
