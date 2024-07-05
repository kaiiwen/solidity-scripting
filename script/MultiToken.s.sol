// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Script.sol";
import "../src/MultiToken.sol";

contract MyMultiTokenScript is Script {
    function deploy() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        new MultiToken(
            "ipfs://QmdKBybmC4ECmGemDpjxcYj5hhox5ccmAFyGHzJDWF5JKX/"
        );

        vm.stopBroadcast();
    }

    function mint(
        address deployedContractAddress,
        address mintTo,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        MultiToken m = MultiToken(deployedContractAddress);
        m.batchMint(mintTo, ids, amounts, data);

        vm.stopBroadcast();
    }
}
