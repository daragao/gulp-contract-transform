var gulp = require('gulp');
var CompileContract = require('./src/compile_contract.js');
var DeployContract = require('./src/deploy_contract.js');

gulp.task('default', function() {
});

var contractsDir = __dirname+'/contracts';
var binContractsDir = __dirname+'/bin/contracts';

gulp.task('compile', function() {
    var options = { overwrite:true };
    CompileContract.compileAllContracts(contractsDir,binContractsDir,options);
});

gulp.task('deploy', function() {
    DeployContract.deployAllContracts(binContractsDir);
});
