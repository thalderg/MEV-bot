const { ethers } = require("ethers");

const UniswapV2ABI = require("./UniswapV2ABI.json"); 

const provider = new ethers.providers.WebSocketProvider("wss://goerli.infura.io/ws/v3/845041c982504a089d1f73b93196f756");

const uniswapV2UniversalRouter = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
// Use this contract for Sushiswap:
// const uniswapV2UniversalRouter = "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506";
const contractInterface = new ethers.utils.Interface(UniswapV2ABI);

async function printTransactionInfo(txHash) {
  const tx = await provider.getTransaction(txHash); 
  const receipt = await provider.getTransactionReceipt(txHash);

  if (tx && tx.to && tx.to.toLowerCase() === uniswapV2UniversalRouter.toLowerCase()) {
    console.log("Transaction Hash:", tx.hash);
    console.log("From:", tx.from);
    console.log("To:", tx.to);
    console.log("Value:", ethers.utils.formatEther(tx.value));
    console.log("Gas Price:", ethers.utils.formatUnits(tx.gasPrice, "gwei"));
    console.log("Gas Limit:", tx.gasLimit.toString());
    console.log("Transaction Data:", tx.data);

    const decodedData = contractInterface.parseTransaction({ data: tx.data });
    console.log("Decoded Transaction Data:", decodedData);
    
    
    // from the decoded TX data check if the tokens being traded are the ones we are looking for
  await provider.getTransactionReceipt(txHash);

 
  }
}


async function mempool() {
  provider.on("pending", async (txHash) => {
    try {
      await printTransactionInfo(txHash); 
    } catch (error) {
      console.log("Error:", error.message);
    }
  });
}

mempool();
