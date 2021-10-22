const hre = require("hardhat");
const chai = require("chai");
const { solidity } = require("ethereum-waffle");
const { parseEther, formatEther } = require("ethers/lib/utils");

chai.use(solidity);

const { expect } = chai;

describe("Membership", function () {
  let MembershipNFTContract;
  let contract;

  let members;
  let owner;
  let member1;
  let member2;

  beforeEach(async function () {
    members = await ethers.getSigners();
    owner = members[0];
    member1 = members[1];
    member2 = members[2];

    MembershipNFTContract = await ethers.getContractFactory("Membership");
    contract = await MembershipNFTContract.deploy();

    await contract.deployed();
    await contract.deployed();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await contract.owner()).to.equal(owner.address);
    });
  });

  describe("Mint", function () {
    it("Requires 1 Eth to mint", async function () {
      expect(
        contract.connect(member1).mint({ value: parseEther("0.5") })
      ).to.be.revertedWith("Mint: Membership costs 1 Eth");
      expect(
        contract.connect(member1).mint({ value: parseEther("1.5") })
      ).to.be.revertedWith("Mint: Membership costs 1 Eth");
    });

    it("Should mint the NFT to the member", async function () {
      await contract.connect(member1).mint({ value: parseEther("1") });

      expect(await contract.balanceOf(member1.address)).to.equal(1);
    });

    it("Should emit a Transfer event", async function () {
      await expect(contract.connect(member1).mint({ value: parseEther("1") }))
        .to.emit(contract, "Transfer")
        .withArgs(ethers.constants.AddressZero, member1.address, "1");
    });

    it("Should prevent minting multiple NFTs to the same member", async function () {
      await contract.connect(member1).mint({ value: parseEther("1") });
      await expect(
        contract.connect(member1).mint({ value: parseEther("1") })
      ).to.be.revertedWith("Member: Already holds a token");
    });

    it("Should return the member's token id", async function () {
      await contract.connect(member1).mint({ value: parseEther("1") });
      expect(await contract.tokenIdOf(member1.address)).to.equal(1);
    });

    it("Should set the correct NFT owner", async function () {
      await contract.connect(member1).mint({ value: parseEther("1") });
      expect(await contract.ownerOf("1")).to.equal(member1.address);
    });
  });

  describe('Membership', function () {
    it('Should increase total membership with each mint', async function () {
      await contract.connect(member1).mint({ value: parseEther("1") })
      expect(await contract.totalMembers()).to.equal(1)
      await contract.connect(member2).mint({ value: parseEther("1") })
      expect(await contract.totalMembers()).to.equal(2)
    });
  });
});
