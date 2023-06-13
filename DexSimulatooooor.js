const ethers = require('ethers');

const provider = new ethers.providers.WebSocketProvider("wss://goerli.infura.io/ws/v3/845041c982504a089d1f73b93196f756");
const tokenABI = require("./UniswapPoolContractABI.json"); 


let genesis = {
    AMM1: {A1: 0, A2: 0, s: 0, fee: 0.02},
    AMM2: { A1: 0, A2: 0, s: 0, fee: 0.02 },
    Trader: {A1: 0, A2: 0, s: 0},
    LP: {A1: 0, A2: 0, s: 0}
};

function swapToAsset1(state, inputs) {
    let agent = inputs[0];
    let dA2 = inputs[1];
    let AMM = inputs[2]
    let feeFactor = 1 - state[AMM]["fee"];
    let dA1 = (state[AMM]["A1"] / (state[AMM]["A2"] + dA2 * feeFactor)) * dA2 * feeFactor;

    if (dA2 > 0 && state[agent]["A2"] - dA2 >= 0) {
        state[AMM]["A2"] += dA2;
        state[agent]["A2"] -= dA2;
        state[AMM]["A1"] -= dA1;
        state[agent]["A1"] += dA1;
    }
}


const mathAddress = "0xeD61FD27F19b55bf78701D6a9e8B4Eb7834B198B"
const wethAddress = "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6"
const uniPoolAddress = "0xbe4007c8aC6E2Bf2Bc0670056062DE540C57C121"
const sushiPoolAddress = "0x05CEf0c92BA2Ec32d09a1A288001C3627a04d9C3";

let mathContract = new ethers.Contract(mathAddress, tokenABI, provider);
let wethContract = new ethers.Contract(wethAddress, tokenABI, provider);

async function getContractValues() {
    let uniMathBalance = await mathContract.balanceOf(uniPoolAddress);
    let uniWethBalance = await wethContract.balanceOf(uniPoolAddress);
    let sushiMathBalance = await mathContract.balanceOf(sushiPoolAddress);
    let sushiWethBalance = await wethContract.balanceOf(sushiPoolAddress);

    genesis.AMM1.A1 = parseFloat(ethers.utils.formatEther(uniMathBalance));
    genesis.AMM1.A2 = parseFloat(ethers.utils.formatEther(uniWethBalance));
    genesis.AMM2.A1 = parseFloat(ethers.utils.formatEther(sushiMathBalance));
    genesis.AMM2.A2 = parseFloat(ethers.utils.formatEther(sushiWethBalance));
}

  
// add function stat simulates pending trade and get new genesis state for AMM1 swapToAsset1()

// add a function that compares the ration of the balances of the two pool and determines arbitrage

getContractValues().then(() => {
    console.log(genesis.AMM1);
    console.log(genesis.AMM2);
});


