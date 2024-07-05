// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "lib/solmate/src/tokens/ERC1155.sol";
import "lib/openzeppelin-contracts/contracts/utils/Strings.sol";
import "lib/openzeppelin-contracts/contracts/access/Ownable.sol";

contract MultiToken is ERC1155, Ownable {
    using Strings for uint256;

    string private baseURI;
    string public contractMetadataURI;

    constructor(string memory _baseURI) ERC1155() Ownable(msg.sender) {
        baseURI = _baseURI;
        contractMetadataURI = contractURI();
    }

    function setBaseURI(string memory _baseURI) external onlyOwner {
        baseURI = _baseURI;
    }

    function uri(
        uint256 id
    ) public view virtual override returns (string memory) {
        return string(abi.encodePacked(baseURI, id.toString(), ".json"));
    }

    function contractURI() public pure returns (string memory) {
        return "ipfs://QmZQn5FbBHLLpFgpUrZ26e3pnmsup5NJe6c284FrVHc1VF";
    }

    function tokenURI(uint256 _tokenId) public view returns (string memory) {
        return string(abi.encodePacked(baseURI, _tokenId.toString(), ".json"));
    }

    function mint(
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) public virtual {
        _mint(to, id, amount, data);
    }

    function batchMint(
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) public virtual {
        _batchMint(to, ids, amounts, data);
    }

    function burn(address from, uint256 id, uint256 amount) public virtual {
        _burn(from, id, amount);
    }

    function batchBurn(
        address from,
        uint256[] memory ids,
        uint256[] memory amounts
    ) public virtual {
        _batchBurn(from, ids, amounts);
    }
}
