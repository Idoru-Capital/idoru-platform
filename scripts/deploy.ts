// /**
//  * Deploy the contracts
//  */
// import { ethers } from "hardhat";
// import {
//   Idoru,
//   Idoru__factory,
//   RoleNames,
//   RoleNames__factory,
// } from "../typechain";

// // https://data-seed-prebsc-1-s1.binance.org:8545

// async function main() {
//   const [deployer] = await ethers.getSigners();

//   //   console.log("Deploying contracts with the account:", deployer.address);

//   //   console.log("Account balance:", (await deployer.getBalance()).toString());

//   //   const tokenFactory = new Idoru__factory(deployer);
//   //   const token = await tokenFactory.deploy();
//   //   await token.deployed();

//   //   const token = new Idoru("0xD48300A2FFD2a84334204DC43d91Ef60dA2d8349");

//   //   console.log("Token address:", token.address);

//   //   const uni = new ethers.Contract(
//   //     UNISWAP,
//   //     [
//   //       "function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)",
//   //     ],
//   //     wallet
//   //   );
// }

// main()
//   .then(() => process.exit(0))
//   .catch((error) => {
//     console.error(error);
//     process.exit(1);
//   });
