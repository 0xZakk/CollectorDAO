# CollectorDAO

This is a project built as part of Optilistic's Solidity bootcamp.

## Spec

The goal of this project is to write governance and membership smart contracts for a DAO that buys valuable NFTs. There are four parts:

1. A treasury that buys valuable NFTs
1. A voting system (that includes delegated voting)
1. A proposal system that calls an arbitrary function on an external contract
1. A membership system that lets people become members

### Membership

Anyone can buy a membership (represented by an NFT) for 1 Eth. Creating proposals and voting are limited only to members. There are no restrictions on membership, other than owning an NFT.

Notes:
- do we want to limit wallets to 1 membership NFT? (i.e. 1 wallet, 1 vote)

### Proposals

Members (only members) can create proposals that can be voted on by other members (only members). A proposal should include a title, description, address for the execution contract.

Bonus features that would be interesting to implement:
- limit the number of active proposals

### Voting

Only members are able to vote on a proposal. Members are able to delegate their vote to other members. For a vote to pass, at least 25% of votes have to be cast.

Notes:
- Use something like ERC712 `balanceOf` and `transfer` - pull from the membership contract 