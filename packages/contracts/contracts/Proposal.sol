// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./IExecutor.sol";
import "./Membership.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

import "hardhat/console.sol";

contract Proposal {
  string public title;
  uint public yays;
  uint public nays;
  uint public totalCastVotes;
  mapping (address => bool) _hasVoted;
  mapping (address => uint) _delegatedVotingPower;
  
  ProposalStatus _proposalStatus;
  VoteStatus _voteStatus;
  
  enum ProposalStatus { Open, Closed }
  enum VoteStatus { Approved, Denied }

  IExecutor public executor;
  Membership public membership;

  event ProposalCreated(address indexed _sponsor, address indexed _executor);

  modifier onlyOpen() { 
    require (_proposalStatus == ProposalStatus.Open, "Proposal: Voting is closed"); 
    _; 
  }

  modifier onlyMembers(address _address) { 
    require(
      membership.tokenIdOf(_address) != 0,
      "Proposal: Only members"
    ); 

    _; 
  }

  modifier hasntVoted(address _address) { 
    require (!_hasVoted[_address], "Proposal: Vote already cast"); 
    _; 
  }

  constructor(address _membership, address _sponsor, address _executor, string memory _title) {
    require(_executor != address(0), "Proposal: Executor can't be empty or the 0 address.");
    membership = Membership(_membership);
    executor = IExecutor(_executor);
    title = _title;
    
    emit ProposalCreated(_sponsor, _executor);
  }

  function delegateVoteTo(address _delegate) public onlyMembers(msg.sender) onlyMembers(_delegate) hasntVoted(msg.sender) hasntVoted(_delegate) {
    _hasVoted[msg.sender] = true;
    _delegatedVotingPower[_delegate] += 1;
  }

  function getVotingPower() public view returns (uint votingPower) {
    votingPower = getVotingPower(msg.sender);
  }

  function getVotingPower(address _voter) public view returns (uint votingPower) {
    require(membership.balanceOf(_voter) == 1, "Proposal: address must be a DAO member");

    // 3 possible scenarios:
    // 1. Address has already voted or delegated (voting power = 0)
    if (_hasVoted[_voter]) {
      votingPower = 0;
    }
    // 2. The address has had votes delegated to them
    else if (_delegatedVotingPower[_voter] > 0) {
      // voting power = # of delegated votes + their original vote
      votingPower = _delegatedVotingPower[_voter] + 1;
    }
    // 3. Address has 1 vote
    else {
      votingPower = 1;
    }
  }

  function vote(bool _vote) public onlyMembers(msg.sender) hasntVoted(msg.sender) {
    uint votingPower = getVotingPower(msg.sender);

    _hasVoted[msg.sender] = true;
    _vote ? yays += votingPower : nays += votingPower;
    totalCastVotes += votingPower;
  }
}
