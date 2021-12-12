import { expect } from "chai";
import { ethers } from "hardhat";

// import { Idoru } from "../typechain/index.ts";
import { Idoru } from "../types";

describe("Token", function () {
  let token: any;

  beforeEach(async function () {
    const Token = await ethers.getContractFactory("Idoru");
    const token = await Token.deploy();
    await token.deployed();
  });

  it("Should make supply and manipulate it", async function () {
    // const [owner, addr1] = await ethers.getSigners();
    const [addr1] = await ethers.getSigners();

    expect(await token.name()).to.equal("Idoru");
    expect(await token.symbol()).to.equal("IDRU");
    expect(await token.decimals()).to.equal(18);

    await token.transfer(addr1.address, 100);

    // transfer tokens somewhere else, reounce ownership and try mint again
    await token.transfer(addr1.address, 100);
    await token.renounceOwnership();
    await expect(token.mint(addr1.address, 100)).to.be.reverted;
  });

  it.only("Should mint tokens", async function () {
    const Token = await ethers.getContractFactory("Idoru");
    const token = await Token.deploy();
    await token.deployed();

    const [addr1] = await ethers.getSigners();

    await token.mint(addr1.address, 100);

    expect(await token.balanceOf(addr1.address)).to.equal(100);
  });
});
