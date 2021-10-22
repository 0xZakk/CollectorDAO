const hre = require("hardhat");
const chai = require("chai");
const { solidity } = require("ethereum-waffle");
const { smock } = require("@defi-wonderland/smock");
const { parseEther, formatEther } = require("ethers/lib/utils");

chai.use(solidity);
chai.use(smock.matchers);

const { expect } = chai;

const errors = {
  VOTE_ALREADY_CAST: "Proposal: Vote already cast",
  ONLY_MEMBERS: "Proposal: Only members",
  VOTING_CLOSED: "Proposal: Voting is closed",
  EXECUTOR_CANT_BE_ZERO_ADDRESS:
    "Proposal: Executor can't be empty or the 0 address.",
  ADDRESS_MUST_BE_DAO_MEMBER: "Proposal: address must be a DAO member",
};

describe("Proposal", function () {
  let ProposalContract;
  let MembershipNFTContract;
  let proposal;
  let executor;
  let membership;

  let members;
  let owner;
  let member1;
  let member2;
  let member3;
  let member4;

  let title = "Test Proposal";

  let voteCost = parseEther("1");

  beforeEach(async function () {
    members = await ethers.getSigners();
    nonMember = members.pop();
    owner = members.pop();
    member1 = members.pop();
    member2 = members.pop();

    executor = await smock.fake("IExecutor");
    ProposalContract = await ethers.getContractFactory("Proposal");
    MembershipNFTContract = await ethers.getContractFactory("Membership");

    membership = await MembershipNFTContract.deploy();
    proposal = await ProposalContract.deploy(
      membership.address,
      owner.address,
      executor.address,
      title
    );

    await proposal.deployed();
    await membership.deployed();

    await membership.connect(member1).mint({ value: voteCost });
    await membership.connect(member2).mint({ value: voteCost });

    for (let i = 0; i < members.length; i++) {
      await membership.connect(members[i]).mint({ value: voteCost });
    }
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await proposal.address).to.not.equal(ethers.constants.AddressZero);
    });

    it("Should set/return the executor contract", async function () {
      expect(await proposal.executor()).to.equal(executor.address);
    });

    it("Should return the correct title", async function () {
      expect(await proposal.title()).to.equal(title);
    });
  });

  describe("Voting Power", function () {
    it("Should only accept member addresses", async function () {
      await expect(
        proposal.connect(nonMember)["getVotingPower()"]()
      ).to.be.revertedWith(errors.ADDRESS_MUST_BE_DAO_MEMBER);
      await expect(
        proposal.connect(member1)["getVotingPower(address)"](nonMember.address)
      ).to.be.revertedWith(errors.ADDRESS_MUST_BE_DAO_MEMBER);
    });

    it("Should return 1 for members that have not delegated their vote", async function () {
      expect(
        await proposal["getVotingPower(address)"](member1.address)
      ).to.equal(1);
      expect(await proposal.connect(member1)["getVotingPower()"]()).to.equal(1);
    });

    it("Should return 0 if the address has already voted", async function () {
      await proposal.connect(member1).vote(true);
      expect(await proposal.connect(member1)["getVotingPower()"]()).to.equal(0);
    });

    it('Should return 0 if address has delegated their vote', async function () {
      await proposal.connect(member1).delegateVoteTo(member2.address)
      expect(await proposal.connect(member1)["getVotingPower()"]()).to.equal(0)
    });

    it('Should return total delegated votes', async function () {
      await proposal.connect(members[0]).delegateVoteTo(member1.address)
      await proposal.connect(members[1]).delegateVoteTo(member1.address)
      await proposal.connect(members[2]).delegateVoteTo(member1.address)
      // 3 delegated votes + their original vote
      expect(await proposal.connect(member1)["getVotingPower()"]()).to.equal(4)
    });
  });

  describe("Delegating", function () {
    // Deletaging Votes
    it("Should prevent non-members from delegating votes", async function () {
      await expect(
        proposal.connect(nonMember).delegateVoteTo(member2.address)
      ).to.be.revertedWith(errors.ONLY_MEMBERS);
    });

    it("Should prevent delegating to a non-member", async function () {
      await expect(
        proposal.connect(member1).delegateVoteTo(nonMember.address)
      ).to.be.revertedWith(errors.ONLY_MEMBERS);
    });

    it("Should let a member delegate their vote to another member", async function () {
      await expect(proposal.connect(member1).delegateVoteTo(member2.address)).to
        .not.be.reverted;
    });

    it("Should reduce a member's voting power when they delegate", async function () {
      await proposal.connect(member1).delegateVoteTo(member2.address);
      expect(await proposal.connect(member1)["getVotingPower()"]()).to.equal(0);
    });

    it("Should prevent a member from voting if they've delegated their vote", async function () {
      await proposal.connect(member1).delegateVoteTo(member2.address);
      await expect(proposal.connect(member1).vote(true)).to.be.revertedWith(
        errors.VOTE_ALREADY_CAST
      );
    });

    it("Should prevent a member from delegating their vote more than once", async function () {
      await proposal.connect(member1).delegateVoteTo(member2.address);
      await expect(
        proposal.connect(member1).delegateVoteTo(members[0].address)
      ).to.be.revertedWith(errors.VOTE_ALREADY_CAST);
    });

    it("Should prevent delegating your vote to an address that has already voted", async function () {
      await proposal.connect(member1).vote(true);
      await expect(
        proposal.connect(member2).delegateVoteTo(member1.address)
      ).to.be.revertedWith(errors.VOTE_ALREADY_CAST);
    });

    it("Should prevent delegating to an address that has delegated", async function () {
      await proposal.connect(member1).delegateVoteTo(member2.address);
      await expect(
        proposal.connect(members[0]).delegateVoteTo(member1.address)
      ).to.be.revertedWith(errors.VOTE_ALREADY_CAST);
    });

    // Bonus:
    //    - member can claim their vote back
  });

  describe("Voting", function () {
    it("Should only let members vote", async function () {
      await expect(proposal.connect(nonMember).vote(false)).to.be.revertedWith(
        errors.ONLY_MEMBERS
      );
    });

    it("Should increase vote count (positive)", async function () {
      await proposal.connect(member1).vote(true);
      expect(await proposal.yays()).to.equal(1);
    });

    it("Should increase vote count (negative)", async function () {
      await proposal.connect(member1).vote(false);
      expect(await proposal.nays()).to.equal(1);
    });

    it("Should increase the total vote count", async function () {
      await proposal.connect(member1).vote(true);
      expect(await proposal.totalCastVotes()).to.equal(1);
      await proposal.connect(member2).vote(false);
      expect(await proposal.totalCastVotes()).to.equal(2);
    });

    it("Should prevent someone from voting twice", async function () {
      await proposal.connect(member1).vote(true);
      await expect(proposal.connect(member1).vote(false)).to.be.revertedWith(
        errors.VOTE_ALREADY_CAST
      );
    });

    it('Should vote with delegated voting power (positive)', async function () {
      await proposal.connect(members[0]).delegateVoteTo(member1.address)
      await proposal.connect(members[1]).delegateVoteTo(member1.address)
      await proposal.connect(members[2]).delegateVoteTo(member1.address)
      await proposal.connect(member1).vote(true)
      expect(await proposal.yays()).to.equal(4)
      expect(await proposal.totalCastVotes()).to.equal(4)
    });

    it('Should vote with delegated voting power (negative)', async function () {
      await proposal.connect(members[0]).delegateVoteTo(member1.address)
      await proposal.connect(members[1]).delegateVoteTo(member1.address)
      await proposal.connect(members[2]).delegateVoteTo(member1.address)
      await proposal.connect(member1).vote(false)
      expect(await proposal.nays()).to.equal(4)
      expect(await proposal.totalCastVotes()).to.equal(4)
    });

    //   - limit voting to only when open
  });


  // Executor
  //    - must be owned by proposal
  //    - close voting
  //    - only if voting status is Approved
  //    - calls `.execute()` on executor function
  //    - can only call `.exectute()` once
});
