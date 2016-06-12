var graphlib = require("graphlib");
var Graph = require("graphlib").Graph;
var solc = require('solc');
var fs = require('fs');
var Pudding = require('ether-pudding');

module.exports = {

    //shamelessly inspired/stolen in truffle js
    resolveImports: function(name,contract) {
        var dependsGraph = new Graph();
        dependsGraph.setNode(name);
        contract.split(/;|\n/).filter(function(line) {
            console.log(line);
            return line.indexOf("import") >= 0;
        }).forEach(function(line) {
            var regex = /import.*("|')([^"']+)("|')*/g;
            var match = regex.exec(line);

            if (match == null) return;
            var file = match[2];

            console.log(file);

            if (!dependsGraph.hasEdge(name, file)) {
                dependsGraph.setEdge(name, file);
            }
        });
        console.log(graphlib.json.write(dependsGraph));
        return dependsGraph;
    },

    compileContract: function(contractFilename,binContractDir,options) {
        var source = fs.readFileSync(contractFilename,{encoding: 'utf8'});
        this.resolveImports(contractFilename,source.toString());
        source = source.toString().replace(/\n/g,' ');

        var compiled = solc.compile(source, 1);

        var contractsObj = {};
        var contractNameArray = Object.keys(compiled.contracts);
        contractNameArray.forEach(function(name) {
            var bytecode = compiled.contracts[name].bytecode;
            var interface = compiled.contracts[name].interface;

            var contract_data = {
                abi: JSON.parse(interface),
                binary: bytecode,
                unlinked_binary: bytecode
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
            compilePromiseArray.push(self.compileContract.bind(self)(filepath,binContractDir,options));
        });
    }
};

