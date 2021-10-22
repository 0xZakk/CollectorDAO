// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract Membership is ERC721URIStorage, Ownable {
  using Counters for Counters.Counter;
  mapping (address => uint) private _memberAddressToTokenId;
  

  Counters.Counter private _tokenId;
  Counters.Counter private _totalMembers;

  event CreatedMembershipNFT(uint indexed tokenID, address indexed member);

  constructor() ERC721("CollectorDAO", "CD") {
  }

  function mint () external payable {
    require(msg.value == 1 ether, "Mint: Membership costs 1 Eth");
    require(balanceOf(msg.sender) == 0, "Member: Already holds a token");

    _tokenId.increment();
    uint id = _tokenId.current();

    _safeMint(msg.sender, id);
    _memberAddressToTokenId[msg.sender] = id;
    _totalMembers.increment();

    emit CreatedMembershipNFT(id, msg.sender);
  }

  function tokenIdOf(address _member) public view returns (uint id) {
    id = _memberAddressToTokenId[_member];
  }

  function totalMembers() public view returns (uint membership) {
    membership = _totalMembers.current();
  }
}