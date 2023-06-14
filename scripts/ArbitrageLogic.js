const ethers = require('ethers');

const provider = new ethers.providers.WebSocketProvider("wss://goerli.infura.io/ws/v3/");
const tokenABI = require("./UniswapPoolContractABI.json"); 


let genesis = {
    AMM1: {A1: 0, A2: 0, s: 0, fee: 0.003},
    AMM2: { A1: 0, A2: 0, s: 0, fee: 0.003},
    Trader: {A1: 100, A2: 100, s: 0},
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
    return state;
}

function swapToAsset2(state, inputs) {
    let agent = inputs[0];
    let dA1 = inputs[1];
    let AMM = inputs[2];
    let feeFactor = 1 - state[AMM]["fee"];
    let dA2 = (state[AMM]["A2"] / (state[AMM]["A1"] + dA1 * feeFactor)) * dA1 * feeFactor;

    if (dA1 > 0 && state[agent]["A1"] - dA1 >= 0) {
        state[AMM]["A1"] += dA1;
        state[agent]["A1"] -= dA1;
        state[AMM]["A2"] -= dA2;
        state[agent]["A2"] += dA2;
    }
    return state;
} 

function addLiquidity(state, inputs) {
    var agent = inputs[0];
    var amountA1 = inputs[1];
    var amountA2 = inputs[2];
    var AMM = inputs[3];

    if (state[agent]["A1"] >= amountA1 && state[agent]["A2"] >= amountA2) {
        state[agent]["A1"] -= amountA1;
        state[agent]["A2"] -= amountA2;
        state[AMM]["A1"] += amountA1;
        state[AMM]["A2"] += amountA2;
        state[agent]["s"] += amountA1 * (amountA2 / state[AMM]["A2"]);
    }
}


const mathAddress = "0xeD61FD27F19b55bf78701D6a9e8B4Eb7834B198B";
const wethAddress = "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6";
const uniPoolAddress = "0xbe4007c8aC6E2Bf2Bc0670056062DE540C57C121";
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

async function Arbitrage(value) {
    await getContractValues();

    let totalTradedA1 = 0;
    let totalTradedA2 = 0;
    let E1, T1, E2, T2, ratio1, ratio2, meanRatio, pool1Liquidity, pool2Liquidity, lessLiquidPool, moreLiquidPool, arbDirection, lessLiquidRatio, tradeSizeA1, tradeSizeA2;
    let direction1 = false;
    let direction2 = false;


    
    do {

        E1 = genesis.AMM1.A1;  // math in Pool1
        T1 = genesis.AMM1.A2;  // eth in Pool1
        E2 = genesis.AMM2.A1;  // math in Pool2
        T2 = genesis.AMM2.A2;  // eth in Pool2

        ratio1 = E1 / T1;
        ratio2 = E2 / T2;
        meanRatio = (ratio1 + ratio2) / 2; 

        console.log(`AMM1 Ratio: ${ratio1}, AMM2 Ratio: ${ratio2}. In amm 1, you get ${1/ratio1} ETH for 1  Math, and in amm2, you get ${1/ratio2} of token ETH for 1 Math.`);


        pool1Liquidity = T1;
        pool2Liquidity = T2;
        lessLiquidPool = pool1Liquidity < pool2Liquidity ? 'AMM1' : 'AMM2';
        moreLiquidPool = pool1Liquidity > pool2Liquidity ? 'AMM1' : 'AMM2';


        arbDirection = ratio1 > ratio2 ? 'Pool1ToPool2' : 'Pool2ToPool1';
        lessLiquidRatio = lessLiquidPool === 'AMM1' ? ratio1 : ratio2;

        tradeSizeA1 = 0.0025 * genesis[lessLiquidPool].A1;
        tradeSizeA2 = 0.0025 * genesis[lessLiquidPool].A2;

        // Execute the arbitrage trades
        if (ratio1 > ratio2 && lessLiquidPool === 'AMM1') {

            let initialBalance = genesis.Trader.A1;
            genesis = swapToAsset1(genesis, ['Trader', tradeSizeA2, lessLiquidPool]);
            
            let newBalance = genesis.Trader.A1;
            let receivedA1 = newBalance - initialBalance;
            totalTradedA1 += receivedA1;  
            totalTradedA2 += tradeSizeA2;
            direction1 = true;

            genesis = swapToAsset2(genesis, ['Trader', receivedA1, moreLiquidPool]);

        } else if (ratio1 > ratio2 && lessLiquidPool === 'AMM2') {



            let initialBalance = genesis.Trader.A2;     
            genesis = swapToAsset2(genesis, ['Trader', tradeSizeA1, lessLiquidPool]);

            let newBalance = genesis.Trader.A2;
            let receivedA2 = newBalance - initialBalance;
            totalTradedA1 += tradeSizeA1;
            totalTradedA2 += receivedA2;
            direction1 = true;

            genesis = swapToAsset1(genesis, ['Trader', receivedA2, moreLiquidPool]);

        } else if (ratio2 > ratio1 && lessLiquidPool === 'AMM1'){

            let initialBalance = genesis.Trader.A2;
            genesis = swapToAsset2(genesis, ['Trader', tradeSizeA1, lessLiquidPool]);

            let newBalance = genesis.Trader.A2;
            let receivedA2 = newBalance - initialBalance;
            totalTradedA1 += tradeSizeA1;
            totalTradedA2 += receivedA2;

            direction1 = true;
            genesis = swapToAsset1(genesis, ['Trader', receivedA2, moreLiquidPool]);

        } else if (ratio2 > ratio1 && lessLiquidPool === 'AMM2'){



            let initialBalance = genesis.Trader.A1;
            totalTradedA2 += tradeSizeA2;

            genesis = swapToAsset1(genesis, ['Trader', tradeSizeA2, lessLiquidPool]);
            let newBalance = genesis.Trader.A1;
            let receivedA1 = newBalance - initialBalance;
            totalTradedA1 += receivedA1;
            totalTradedA2 += tradeSizeA2;

            direction1 = true;
            genesis = swapToAsset2(genesis, ['Trader', receivedA1, moreLiquidPool]);

        } else {

        }

    } while (Math.abs(ratio1 - ratio2) / meanRatio > 0.02); // Loop until the ratios are within 2% of each other

    if (genesis.Trader.A1 > 100) {

        let extraA1 = genesis.Trader.A1 - 100;

        genesis = swapToAsset2(genesis, ['Trader', extraA1, moreLiquidPool]);

      }
    let extraA2 = genesis.Trader.A2 - 100;  
    console.log(genesis);
    if (direction1 === true) {
        console.log('profit in ETH: ' + extraA2);
        console.log(`Trade ${totalTradedA1} Math into AMM2`);
        console.log(`Trade ${totalTradedA2} ETH into AMM1`);
    }
    else if (direction2 === true) {

        console.log(`Trade ${totalTradedA1} Math into AMM1`);
        console.log(`Trade ${totalTradedA2} ETH into AMM2`);
        console.log('profit in ETH: ' + extraA2);
    }
    else {
        console.log('No arbitrage opportunity found');
    }
}



