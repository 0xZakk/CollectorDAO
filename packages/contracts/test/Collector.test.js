const hre = require("hardhat");
const chai = require("chai");
const { solidity } = require("ethereum-waffle");
const { parseEther, formatEther } = require("ethers/lib/utils");

chai.use(solidity);

const { expect } = chai;

describe("Collector", function () {
  let CollectorContract;
  let MembershipNFTContract;
  let collector;
  let membership;

  let members;
  let owner;
  let member1;
  let member2;
  let member3;
  let member4;
  let nonMember;

  beforeEach(async function () {
    members = await ethers.getSigners();
    owner = members[0];
    member1 = members[1];
    member2 = members[2];
    member3 = members[3];
    member4 = members[4];
    nonMember = members.pop();

    CollectorContract = await ethers.getContractFactory("Collector");
    MembershipNFTContract = await ethers.getContractFactory("Membership");

    collector = await CollectorContract.deploy();
    membership = await MembershipNFTContract.deploy();

    await collector.deployed();
    await membership.deployed();

    await membership.connect(member1).mint({ value: parseEther("1") });
    await membership.connect(member2).mint({ value: parseEther("1") });
    await membership.connect(member3).mint({ value: parseEther("1") });
    await membership.connect(member4).mint({ value: parseEther("1") });
  });

  describe("Deployment", function () {
    it("Should deploy", async function () {
      expect(await collector.address).to.not.equal(
        ethers.constants.AddressZero
      );
    });
  });
});
