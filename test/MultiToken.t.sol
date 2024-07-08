// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.26;

import { DSTest } from "../lib/solmate/lib/ds-test/src/test.sol";
import { MultiToken } from "src/MultiToken.sol";

import { ERC1155TokenReceiver } from "lib/solmate/src/tokens/ERC1155.sol";

contract ERC1155Recipient is ERC1155TokenReceiver {
    address public operator;
    address public from;
    uint256 public id;
    uint256 public amount;
    bytes public mintData;

    function onERC1155Received(
        address _operator,
        address _from,
        uint256 _id,
        uint256 _amount,
        bytes calldata _data
    ) public override returns (bytes4) {
        operator = _operator;
        from = _from;
        id = _id;
        amount = _amount;
        mintData = _data;

        return ERC1155TokenReceiver.onERC1155Received.selector;
    }

    address public batchOperator;
    address public batchFrom;
    uint256[] internal _batchIds;
    uint256[] internal _batchAmounts;
    bytes public batchData;

    function batchIds() external view returns (uint256[] memory) {
        return _batchIds;
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
    ) external override returns (bytes4) {
        batchOperator = _operator;
        batchFrom = _from;
        _batchIds = _ids;
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
        revert(string(abi.encodePacked(ERC1155TokenReceiver.onERC1155Received.selector)));
    }

    function onERC1155BatchReceived(
        address,
        address,
        uint256[] calldata,
        uint256[] calldata,
        bytes calldata
    ) external pure override returns (bytes4) {
        revert(string(abi.encodePacked(ERC1155TokenReceiver.onERC1155BatchReceived.selector)));
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
        return 0xCAFEBEEF;
    }

    function onERC1155BatchReceived(
        address,
        address,
        uint256[] calldata,
        uint256[] calldata,
        bytes calldata
    ) external pure override returns (bytes4) {
        return 0xCAFEBEEF;
    }
}

contract NonERC1155Recipient {}

contract MultiTokenTest is DSTest, ERC1155TokenReceiver {
    MultiToken token;

    mapping(address => mapping(uint256 => uint256)) public userMintAmounts;
    mapping(address => mapping(uint256 => uint256)) public userTransferOrBurnAmounts;

    function setUp() public {
        token = new MultiToken("https://example.com/metadata/");
    }

    function testMintToEOA() public {
        token.mint(address(0xBEEF), 1337, 1, "");

        assertEq(token.balanceOf(address(0xBEEF), 1337), 1);
    }

    function testMintToERC1155Recipient() public {
        ERC1155Recipient to = new ERC1155Recipient();

        token.mint(address(to), 1337, 1, "testing 123");

        assertEq(token.balanceOf(address(to), 1337), 1);

        assertEq(to.operator(), address(this));
        assertEq(to.from(), address(0));
        assertEq(to.id(), 1337);
        assertEq(keccak256(to.mintData()), keccak256("testing 123"));
    }

    function testBatchMintToEOA() public {
        uint256[] memory ids = new uint256[](5);
        ids[0] = 1337;
        ids[1] = 1338;
        ids[2] = 1339;
        ids[3] = 1340;
        ids[4] = 1341;

        uint256[] memory amounts = new uint256[](5);
        amounts[0] = 100;
        amounts[1] = 200;
        amounts[2] = 300;
        amounts[3] = 400;
        amounts[4] = 500;

        token.batchMint(address(0xBEEF), ids, amounts, "");

        assertEq(token.balanceOf(address(0xBEEF), 1337), 100);
        assertEq(token.balanceOf(address(0xBEEF), 1338), 200);
        assertEq(token.balanceOf(address(0xBEEF), 1339), 300);
        assertEq(token.balanceOf(address(0xBEEF), 1340), 400);
        assertEq(token.balanceOf(address(0xBEEF), 1341), 500);
    }

    function testBurn() public {
        token.mint(address(this), 1337, 1, "");
        assertEq(token.balanceOf(address(this), 1337), 1);

        token.burn(address(this), 1337, 1);
        assertEq(token.balanceOf(address(this), 1337), 0);
    }

    function testBatchBurn() public {
        uint256[] memory ids = new uint256[](2);
        ids[0] = 1337;
        ids[1] = 1338;

        uint256[] memory amounts = new uint256[](2);
        amounts[0] = 1;
        amounts[1] = 1;

        token.batchMint(address(this), ids, amounts, "");
        assertEq(token.balanceOf(address(this), 1337), 1);
        assertEq(token.balanceOf(address(this), 1338), 1);

        token.batchBurn(address(this), ids, amounts);
        assertEq(token.balanceOf(address(this), 1337), 0);
        assertEq(token.balanceOf(address(this), 1338), 0);
    }

    function testSetBaseURI() public {
        token.setBaseURI("https://example.com/new-metadata/");
        assertEq(token.uri(1), "https://example.com/new-metadata/1.json");
    }

    function testContractURI() public {
        assertEq(token.contractURI(), "ipfs://QmZQn5FbBHLLpFgpUrZ26e3pnmsup5NJe6c284FrVHc1VF");
    }

    function testTokenURI() public {
        assertEq(token.tokenURI(1), "https://example.com/metadata/1.json");
    }

    function testRevertIfNonOwnerSetsBaseURI() public {
        (bool success, ) = address(token).call(
            abi.encodeWithSelector(token.setBaseURI.selector, "https://example.com/new-metadata/")
        );
        assertTrue(!success);
    }
}
