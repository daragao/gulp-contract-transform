var gulp = require('gulp');
var contractTransform = require('./gulp-contract-transform.js');

gulp.task('default', function() {
});

gulp.task('compile', function() {
    gulp.src('contracts/**/*.sol')
    .pipe(contractTransform.compileContracts())
    .pipe(gulp.dest('modified-files'))
});

gulp.task('deploy', function() {
    gulp.src('modified-files/**/*.sol.js')
    .pipe(contractTransform.deployContracts())
    .pipe(gulp.dest('modified-files-deployed'))
});
