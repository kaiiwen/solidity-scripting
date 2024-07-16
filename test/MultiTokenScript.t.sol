// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.26;

import {DSTest} from "../lib/solmate/lib/ds-test/src/test.sol";
import {MultiTokenScript} from "script/MultiToken.s.sol";
import {MultiToken} from "src/MultiToken.sol";
import {ERC1155TokenReceiver} from "lib/solmate/src/tokens/ERC1155.sol";

contract MultiTokenScriptTest is DSTest {
    MultiTokenScript private script;
    MultiToken private multiToken;
    address public deployer;
    address public user;

    function setUp() public {
        script = new MultiTokenScript();
        deployer = 0xEc38dA4D0947C03573b3B1eb98cCbcd2F1292369;
        user = address(1);
        multiToken = new MultiToken(
            "https://example.com/",
            "https://example.com/metadata",
            "MultiToken",
            "MT"
        );
        multiToken.grantRole(multiToken.MINTER_ROLE(), deployer);
    }

    function test_Deploy() public {
        script.deploy(
            "https://example.com/",
            "https://example.com/metadata",
            "MultiToken",
            "MT"
        );
    }

    function test_Mint() public {
        // Setup addresses and roles
        uint256[] memory ids = new uint256[](1);
        uint256[] memory amounts = new uint256[](1);
        ids[0] = 1;
        amounts[0] = 1;

        script.deploy(
            "https://example.com/",
            "https://example.com/metadata",
            "MultiToken",
            "MT"
        );

        script.mint(address(multiToken), deployer, ids, amounts, "");

        // Verify minting
        assertEq(multiToken.balanceOf(deployer, 1), 1);
    }

    function testFailMint() public {
        multiToken.revokeRole(multiToken.BURNER_ROLE(), deployer);

        uint256[] memory ids = new uint256[](1);
        uint256[] memory amounts = new uint256[](1);
        ids[0] = 1;
        amounts[0] = 1;

        script.deploy(
            "https://example.com/",
            "https://example.com/metadata",
            "MultiToken",
            "MT"
        );

        script.mint(address(multiToken), deployer, ids, amounts, "");
    }
}
