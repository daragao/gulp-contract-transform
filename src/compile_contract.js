var solc = require('solc');
var fs = require('fs');
var Pudding = require('ether-pudding');

module.exports = {

    compileContract: function(contractFilename,binContractDir,options) {
        var source = fs.readFileSync(contractFilename,{encoding: 'utf8'});
        source = source.toString().replace(/\n/g,' ');

        var compiled = solc.compile(source, 1);

        var contractsObj = {};
        var contractNameArray = Object.keys(compiled.contracts);
        contractNameArray.forEach(function(name) {
            var bytecode = compiled.contracts[name].bytecode;
            var interface = compiled.contracts[name].interface;

            var contract_data = {
                abi: JSON.parse(interface),
                binary: bytecode
            };
            contractsObj[name] = contract_data;
        });

        var binContractDir = binContractDir || './bin/contracts'
        var options = options || { overwrite:true };
        var savePromise =  Pudding.saveAll(contractsObj, binContractDir,options);
        return savePromise.then(function() {
            console.log('Contracts generated!');
        });
    },

    compileAllContracts: function(contractDir,binContractDir,options) {
        var self = this;
        files = fs.readdirSync(contractDir);
        var compilePromiseArray = [];
        files.forEach(function(filename) {
            var filepath = contractDir + '/' + filename;
            compilePromiseArray.push(self.compileContract(filepath,binContractDir,options));
        });
    }
};

