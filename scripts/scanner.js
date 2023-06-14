const { ethers } = require("ethers");

const UniswapV2ABI = require("./UniswapV2ABI.json"); 

const provider = new ethers.providers.WebSocketProvider("wss://goerli.infura.io/ws/v3/845041c982504a089d1f73b93196f756");

const uniswapV2UniversalRouter = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
const contractInterface = new ethers.utils.Interface(UniswapV2ABI);
const tokenAddress = "0xeD61FD27F19b55bf78701D6a9e8B4Eb7834B198B"

async function printTransactionInfo(txHash, tokenAddress) {
  const tx = await provider.getTransaction(txHash); 

  if (tx && tx.to && tx.to.toLowerCase() === uniswapV2UniversalRouter.toLowerCase()) {
    const decodedData = contractInterface.parseTransaction({ data: tx.data });

    // If this is a swapExactETHForTokens transaction
    if (decodedData.name === 'swapExactETHForTokens') {
      // Get the path of the swap
      const path = decodedData.args.path;
      console.log("Path:", path);
      console.log("TokenPath:", path[path.length - 1]);

      // If the last address in the path is the address of the token being received
      if (path[path.length - 1].toLowerCase() === tokenAddress.toLowerCase()) {
        console.log("Transaction Hash:", tx.hash);
        console.log("From:", tx.from);
        console.log("To:", tx.to);
        console.log("Value:", ethers.utils.formatEther(tx.value));
        console.log("Gas Price:", ethers.utils.formatUnits(tx.gasPrice, "gwei"));
        console.log("Gas Limit:", tx.gasLimit.toString());
        console.log("Transaction Data:", tx.data);
        console.log("Decoded Transaction Data:", decodedData);
      }
    }
  }
}

//take the value and send it to the arb logic

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
