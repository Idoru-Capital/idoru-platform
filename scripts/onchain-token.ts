/**
 * Test the contracts on test chain
 */
import { ethers as ethers_t } from "ethers";
import { ethers } from "hardhat";
import { TEN } from "../test/constants";
import {
  Idoru,
  IdoruMinter__factory,
  // Idoru,
  Idoru__factory,
  RoleNames,
  // RoleNames,
  // RoleNames__factory,
} from "../typechain";
import { mumbaiAddresses } from "./config";

// import IdoruABI from "../artifacts/contracts/Idoru.sol/Idoru.json";

const setPresaleLimit = async (signer: ethers_t.Signer) => {
  const minter = new IdoruMinter__factory(signer).attach(
    mumbaiAddresses.minterAddress
  );
  const token = new Idoru__factory(signer).attach(mumbaiAddresses.idoruAddress);

  const tx = await minter.setPresaleTokensToMint(
    ethers.BigNumber.from(TEN.pow((await token.decimals()) + 2))
  );
  console.log(tx);
  const reciept = await tx.wait();
  console.log(reciept);
};

const burnAll = async (token: Idoru, address: string) => {
  console.log(await token.decimals());

  await token.burn(await token.balanceOf(address));

  console.log("Token address:", token.address);

  console.log(await token.balanceOf(address));
};

const giveMinterPermissions = async (signer: ethers_t.Signer) => {
  const minter = new IdoruMinter__factory(signer).attach(
    mumbaiAddresses.minterAddress
  );
  const token = new Idoru__factory(signer).attach(mumbaiAddresses.idoruAddress);

  const tx = await token.grantRole(
    "0xf0887ba65ee2024ea881d91b74c2450ef19e1557f03bed3ea9f16b037cbe2dc9",
    minter.address
  );
  console.log(tx);
  const reciept = await tx.wait();
  console.log(reciept);
};

async function main() {
  const [deployer] = await ethers.getSigners();

  const token = new Idoru__factory(deployer).attach(
    mumbaiAddresses.idoruAddress
  );
  console.log(await token.balanceOf(deployer.address));

  if (!(await token.isVerified(deployer.address))) {
    console.log("User is not KYCed yet");

    await token.subscribeDividends();
    await token.verifyAddress(deployer.address);

    console.log(await token.numCheckpoints(deployer.address));

    console.log(`User ${deployer.address} is now KYCed`);
  }

  // await setPresaleLimit(deployer);
  await giveMinterPermissions(deployer);

  // burnAll(token, deployer.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
