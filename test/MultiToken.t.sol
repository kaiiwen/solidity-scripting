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
        token = new MultiToken(
            "https://example.com/api/token/",
            "https://example.com/api/contract.json"
        );

        token.grantRole(token.MINTER_ROLE(), address(this));
        token.grantRole(token.BURNER_ROLE(), address(this));
    }

    //Test Case #1 - Minting to an EOA
    function testMintToEOA() public {
        token.mint(address(0xBEEF), 1337, 1, "");

        assertEq(token.balanceOf(address(0xBEEF), 1337), 1);
    }

    //Test Case #2 - Minting to an ERC1155Recipient
    function testMintToERC1155Recipient() public {
        ERC1155Recipient to = new ERC1155Recipient();

        token.mint(address(to), 1337, 1, "testing 123");

        assertEq(token.balanceOf(address(to), 1337), 1, "testing 123");

        assertEq(to.operator(), address(this));
        assertEq(to.from(), address(0));
        assertEq(to.tokenId(), 1337);
        assertEq(to.amount(), 1);
        // assertEq(to.data(), "testing 123");
    }

    //Test Case #3 - testing BatchMint method from MultiToken.sol
    function testBatchMintToEOA() public {
        uint256[] memory ids = new uint256[](3);
        ids[0] = 1337;
        ids[1] = 1338;
        ids[2] = 1339;

        uint256[] memory amounts = new uint256[](3);
        amounts[0] = 100;
        amounts[1] = 200;
        amounts[2] = 300;

        token.batchMint(address(0xBEEF), ids, amounts, "testing 123");

        assertEq(token.balanceOf(address(0xBEEF), 1337), 100, "testing 123");
        assertEq(token.balanceOf(address(0xBEEF), 1338), 200, "testing 123");
        assertEq(token.balanceOf(address(0xBEEF), 1339), 300, "testing 123");
    }

    //Test Case #4 - testing BatchMint method from MultiToken.sol to ERC1155Recipient
    function testBatchMintToERC1155Recipient() public {
        ERC1155Recipient to = new ERC1155Recipient();

        uint256[] memory ids = new uint256[](3);
        ids[0] = 1337;
        ids[1] = 1338;
        ids[2] = 1339;

        uint256[] memory amounts = new uint256[](3);
        amounts[0] = 100;
        amounts[1] = 200;
        amounts[2] = 300;

        token.batchMint(address(to), ids, amounts, "testing 123");

        assertEq(token.balanceOf(address(to), 1337), 100, "testing 123");
        assertEq(token.balanceOf(address(to), 1338), 200, "testing 123");
        assertEq(token.balanceOf(address(to), 1339), 300, "testing 123");
    }

    //Test Case #5 - test burn method from MultiToken.sol
    function testBurn() public {
        token.mint(address(0xBEEF), 1377, 100, "");

        token.burn(address(0xBEEF), 1377, 70);

        assertEq(token.balanceOf(address(0xBEEF), 1377), 30);
    }

    //Test Case #6 - test batchBurn method from MultiToken.sol
    function testBatchBurn() public {
        uint256[] memory ids = new uint256[](3);
        ids[0] = 1337;
        ids[1] = 1338;
        ids[2] = 1339;

        uint256[] memory amounts = new uint256[](3);
        amounts[0] = 100;
        amounts[1] = 200;
        amounts[2] = 300;

        token.batchMint(address(0xBEEF), ids, amounts, "testing 123");

        token.batchBurn(address(0xBEEF), ids, amounts);

        assertEq(token.balanceOf(address(0xBEEF), 1337), 0);
        assertEq(token.balanceOf(address(0xBEEF), 1338), 0);
        assertEq(token.balanceOf(address(0xBEEF), 1339), 0);
    }

     function testApproveAll() public {
        token.setApprovalForAll(address(0xBEEF), true);

        assertTrue(token.isApprovedForAll(address(this), address(0xBEEF)));
    }
}
