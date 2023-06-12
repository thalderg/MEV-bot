import { ethers } from "hardhat";
import { MyToken__factory } from "../typechain-types";
import * as dotenv from 'dotenv';
dotenv.config()

async function main() {
    console.log("Connecting to blockchain");
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY ?? "");
    console.log(`Using address ${process.env.ADDRESS}`);
    console.log(`Alchemy key is of length ${process.env.ALCHEMY_API_KEY?.length}`)
    const provider = new ethers.providers.AlchemyProvider("goerli", process.env.ALCHEMY_API_KEY);
    const lastBlock = await provider.getBlock("latest");
    console.log(`The last block is ${lastBlock.number}`)
     
    const signer = wallet.connect(provider);
    const balance = await signer.getBalance();
    console.log(`Wallet balance is ${Number(balance) / 1e18} ETH`); 

    
    const [deployer, acc1, acc2addy] = [signer, signer, "0xD94DF9695B44f2e04E083740602d6326e13FddC0"] //pedro
    const tokenContractFactory = new MyToken__factory(deployer);
    const tokenContract = await tokenContractFactory.deploy('MatheusCoin', 'MATH');
    const tokenContractDeployTxReceipt = await tokenContract.deployTransaction.wait();

    console.log(`Token Contract deployed at the address ${tokenContract.address} at block ${tokenContractDeployTxReceipt.blockNumber}`);

    const code = await tokenContract.MINTER_ROLE();

    const roleTx = await tokenContract.grantRole(code, acc1.address);
    await roleTx.wait();

    const mintTx = await tokenContract.connect(acc1).mint(acc2addy, 1000 * 10 **10);
    const mintTxReceipt = await mintTx.wait();
    console.log(`Mint tx completed with has ${mintTxReceipt.transactionHash}`);

    const mintTxTwo = await tokenContract.connect(acc1).mint(acc1.address, 1000 * 10 **10);
    const mintTxReceiptTwo = await mintTx.wait();
    console.log(`Mint tx completed with has ${mintTxReceiptTwo.transactionHash}`);

}

main();
