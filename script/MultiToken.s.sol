// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Script.sol";
import "../src/MultiToken.sol";

contract MultiTokenScript is Script {
    function deploy(
        string memory _baseURI,
        string memory _contractMetedataURI,
        string memory _name,
        string memory _symbol
    ) external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        MultiToken m = new MultiToken(
            _baseURI,
            _contractMetedataURI,
            _name,
            _symbol
        );
        m.grantRole(m.MINTER_ROLE(), vm.addr(deployerPrivateKey));

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
