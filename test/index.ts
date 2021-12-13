import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";

// import { Idoru } from "../typechain/index";
import { Idoru, Idoru__factory } from "../typechain";

describe("Idoru token", function () {
  let token: Idoru;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();

    const tokenFactory = new Idoru__factory(owner);
    token = await tokenFactory.deploy();
    await token.deployed();
  });

  it.only("Should make supply and manipulate it", async function () {
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

  it("Should mint tokens", async function () {
    await token.mint(addr1.address, 100);

    expect(await token.balanceOf(addr1.address)).to.equal(100);
  });
});
