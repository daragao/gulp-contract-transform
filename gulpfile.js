var gulp = require('gulp');
var CompileContract = require('./src/compile_contract.js');
var DeployContract = require('./src/deploy_contract.js');

gulp.task('default', function() {
});

gulp.task('compile', function() {
    CompileContract.compileAllContracts('./contracts');
});

gulp.task('deploy', function() {
    DeployContract.deployAllContracts('./bin/contracts');
});
