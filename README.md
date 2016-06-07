# FirstEthereumExperiment
#### I have only used this example with the testrpc, not yet on the testnet :(
This is my first experiment to understand how Ethereum works :) Something to just, compile, deploy and use

Each one of the files is an example of how to interact with the contract :)

## How to run the example

1. Start testrpc on one terminal
  - run [`testrpc`](https://github.com/ethereumjs/testrpc)
2. Compile the contract (this will generate a Greeter.sol.js that is used by the other scripts)
  - [`node compile_contract.js Greeter`](compile_contract.js) the script needs the name of the contractor, that should be the same has the filename of the contractor
3. Deploy the contract (this will run the contract constructor)
  - [`node deploy_contract.js Greeter 'Hello World!'`](deploy_contract.js) the script needs the name of the contract and the arguments of its constructor
4. Use the contract (here we will use a deployed contract)
  - [`node use_contract.js 0xe8b937d621d670015c9b450f5d8f1dd942c66ef7`](use_contract.js) the response of the previous step will return an address for the the deployed address, that address is needed to get the contract

## Some nice images of it working

![testrpc](https://github.com/daragao/FirstEthereumExperiment/blob/master/testrpc.png)

![commands](https://github.com/daragao/FirstEthereumExperiment/blob/master/commands.png)
