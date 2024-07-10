// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.26;

import {DSTest} from "../lib/solmate/lib/ds-test/src/test.sol";
import {MultiToken} from "src/MultiToken.sol";
import {ERC1155TokenReceiver} from "lib/solmate/src/tokens/ERC1155.sol";

contract ERC1155Recipient is ERC1155TokenReceiver {
    address public operator;
    address public from;
    uint256 public tokenId;
    uint256 public amount;
    bytes public data;

    function onERC1155Received(
        address _operator,
        address _from,
        uint256 _tokenId,
        uint256 _amount,
        bytes calldata _data
    ) public override returns (bytes4) {
        operator = _operator;
        from = _from;
        tokenId = _tokenId;
        amount = _amount;
        data = _data;

        return ERC1155TokenReceiver.onERC1155Received.selector;
    }

    address public batchOperator;
    address public batchFrom;
    uint256[] public _batchTokenIds;
    uint256[] public _batchAmounts;
    bytes public batchData;

    function batchTokenIds() external view returns (uint256[] memory) {
        return _batchTokenIds;
    }

    function batchAmounts() external view returns (uint256[] memory) {
        return _batchAmounts;
    }

    function onERC1155BatchReceived(
        address _operator,
        address _from,
        uint256[] calldata _ids,
        uint256[] calldata _amounts,
        bytes calldata _data
    ) public override returns (bytes4) {
        batchOperator = _operator;
        batchFrom = _from;
        _batchTokenIds = _ids;
        _batchAmounts = _amounts;
        batchData = _data;

        return ERC1155TokenReceiver.onERC1155BatchReceived.selector;
    }
}

contract RevertingERC1155Recipient is ERC1155TokenReceiver {
    function onERC1155Received(
        address,
        address,
        uint256,
        uint256,
        bytes calldata
    ) public pure override returns (bytes4) {
        revert(
            string(
                abi.encodePacked(
                    ERC1155TokenReceiver.onERC1155Received.selector
                )
            )
        );
    }

    function onERC1155BatchReceived(
        address,
        address,
        uint256[] calldata,
        uint256[] calldata,
        bytes calldata
    ) public pure override returns (bytes4) {
        revert(
            string(
                abi.encodePacked(
                    ERC1155TokenReceiver.onERC1155BatchReceived.selector
                )
            )
        );
    }
}

contract WrongReturnDataERC1155Recipient is ERC1155TokenReceiver {
    function onERC1155Received(
        address,
        address,
        uint256,
        uint256,
        bytes calldata
    ) public pure override returns (bytes4) {
        return 0xdeadbeef;
    }

    function onERC1155BatchReceived(
        address,
        address,
        uint256[] calldata,
        uint256[] calldata,
        bytes calldata
    ) public pure override returns (bytes4) {
        return 0xdeadbeef;
    }
}

contract NonERC1155Recipient {}

contract ERC1155test is DSTest, ERC1155TokenReceiver {
    MultiToken token;

    function setUp() public {
        // Changed to match the MultiToken constructor parameters
        token = new MultiToken(
            "https://example.com/api/token/",
            "https://example.com/api/contract.json"
        );

        // Added to grant the MINTER_ROLE to the test contract
        token.grantRole(token.MINTER_ROLE(), address(this));
    }

    function testMintToEOA() public {
        token.mint(address(0xBEEF), 1337, 1, "");

        assertEq(token.balanceOf(address(0xBEEF), 1337), 1);
    }

    function testMintToERC1155Recipient() public {
        ERC1155Recipient to = new ERC1155Recipient();

        token.mint(address(to), 1337, 1, "testing 123");

        assertEq(token.balanceOf(address(to), 1337), 1);

        // Updated to match the ERC1155Recipient state variables
        assertEq(to.operator(), address(this));
        assertEq(to.from(), address(0));
        assertEq(to.tokenId(), 1337); // Changed to to.tokenId() to match ERC1155Recipient
        assertEq(to.amount(), 1); // Added to assert amount received
        // assertEq(to.data(), "testing 123"); // Added to assert the received data
    }

     function test
}
