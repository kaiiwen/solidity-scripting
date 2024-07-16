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
        deployer = address(1);
        user = address(2);
        multiToken = new MultiToken("https://example.com/", "https://example.com/metadata");
    }

    function test_Deploy() public {
        script.deploy("https://example.com/", "https://example.com/metadata");
    }

    function test_Mint() public {
        script.mint(address(multiToken), address(1), new uint256[](1), new uint256[](1), "");
    }
}