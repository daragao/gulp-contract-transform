var fs = require('fs');
var Web3 = require('web3');
var web3 = new Web3();
var Pudding = require('ether-pudding');

module.exports = {
    //the unlinked binary needs to be changed in order for the imports to work
    //truffle line https://github.com/ConsenSys/truffle/blob/master/lib/contracts.js#L333
    //truffle line https://github.com/ConsenSys/truffle/blob/master/lib/contracts.js#L367
    resolveDependencies: function(contract_class) {
      var regex = /__([^_]*)_*/g;
      var matches;
      console.log(contract_class.unlinked_binary);
      while ( (matches = regex.exec(contract_class.unlinked_binary)) !== null ) {
        var lib = matches[1];
        console.log(lib);
      }
    },

    deployContract: function(contractFilename,contractParams,account,gas) {
        var provider = new web3.providers.HttpProvider('http://localhost:8545');
        web3.setProvider(provider);

        account = account || web3.eth.accounts[0];
        gas = gas || 3000000;
        var Contract = require(contractFilename);
        Contract.setProvider(provider);
        Contract.defaults({
            from:account,
            gas: gas
        });

        var self = this;
        contractParams = contractParams || [];
        var deployedContract = Contract.new.apply(Contract,contractParams);
       return deployedContract.then(function(contractInstance) {
           console.log(contractFilename+' contract address: '+contractInstance.address);
           Contract.address = contractInstance.address;
           self.resolveDependencies(Contract);
           return Contract;
        }).then(function(contract){
            return Pudding.save(Contract.name,Contract,contractFilename);
        }).catch(function(err) {
            console.log("Error creating contract!");
            console.log(err.stack);
        });
    },

    deployAllContracts: function(compiledContractDir) {
        var self = this;
        files = fs.readdirSync(compiledContractDir);
        var deployPromiseArray = [];
        files.forEach(function(filename) {
            var filepath = compiledContractDir + '/' + filename;
            deployPromiseArray.push(self.deployContract(filepath));
        });
    }
};
