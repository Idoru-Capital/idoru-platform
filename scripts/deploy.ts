/**
 * Deploy the contracts
 */

import { ethers as ethers_types } from "ethers";
import { ethers } from "hardhat";
import { TEN } from "../test/constants";
import {
  Idoru,
  Idoru__factory,
  // IdoruMinter,
  IdoruMinter__factory,
  // IdoruStableCoin,
  IdoruStableCoin__factory,
  PresaleMinter__factory,
} from "../typechain";
import { mumbaiAddresses } from "./config";

// https://data-seed-prebsc-1-s1.binance.org:8545

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  console.log("Account balance:", (await deployer.getBalance()).toString());

  // const tokenFactory = new Idoru__factory(deployer);
  // const token = await tokenFactory.deploy();
  // await token.deployed();
  // console.log("Token deployed on", token.address);

  // const token = new Idoru("0xD48300A2FFD2a84334204DC43d91Ef60dA2d8349");

  // console.log("Token address:", token.address);

  // const idoruStableFactory = new IdoruStableCoin__factory(deployer);
  // const idoruStable = await idoruStableFactory.deploy();
  // await idoruStable.deployed();

  // console.log("IdoruStableCoin address:", idoruStable.address);

  const presaleMinterFactory = new PresaleMinter__factory(deployer);
  const presaleMinter = await presaleMinterFactory.deploy(
    mumbaiAddresses.idoruAddress,
    mumbaiAddresses.WMATICAddress,
    mumbaiAddresses.idoruStableAddress,
    mumbaiAddresses.bankAddress
  );
  await presaleMinter.deployed();
  console.log("Presale minter address:", presaleMinter.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
