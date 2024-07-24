// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "lib/solmate/src/tokens/ERC1155.sol";
import "lib/solmate/src/utils/LibString.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

contract MultiToken is ERC1155, AccessControl {
    using LibString for uint256;
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");

    string private baseURI;
    string private contractMetadataURI;
    string private contractName;
    string private contractSymbol;

    constructor(
        string memory _baseURI,
        string memory _contractMetedataURI,
        string memory _name,
        string memory _symbol
    ) ERC1155() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        baseURI = _baseURI;
        contractMetadataURI = _contractMetedataURI;
        contractName = _name;
        contractSymbol = _symbol;
    }

    function name() public view returns (string memory) {
        return contractName;
    }

    function symbol() public view returns (string memory) {
        return contractSymbol;
    }

    function uri(
        uint256 id
    ) public view virtual override returns (string memory) {
        return string(abi.encodePacked(baseURI, "/", id.toString(), ".json"));
    }

    function contractURI() public view returns (string memory) {
        return contractMetadataURI;
    }

    function tokenURI(uint256 _tokenId) public view returns (string memory) {
        return string(abi.encodePacked(baseURI, _tokenId.toString(), ".json")) ;
    }

    function mint(
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) public virtual onlyRole(MINTER_ROLE) {
        _mint(to, id, amount, data);
    }

    function batchMint(
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) public virtual onlyRole(MINTER_ROLE) {
        _batchMint(to, ids, amounts, data);
    }

    function burn(
        address from,
        uint256 id,
        uint256 amount
    ) public virtual onlyRole(BURNER_ROLE) {
        _burn(from, id, amount);
    }

    function batchBurn(
        address from,
        uint256[] memory ids,
        uint256[] memory amounts
    ) public virtual onlyRole(BURNER_ROLE) {
        _batchBurn(from, ids, amounts);
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override(AccessControl, ERC1155) returns (bool) {
        return ERC1155(address(this)).supportsInterface(interfaceId);
    }
}
