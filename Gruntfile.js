module.exports = function(grunt) {
  grunt.initConfig( {
      concat: {
        options: {
          separator: '\n'
        },
        dist: {
        // the files to concatenate
          src: ['app/restitute.js', 'app/**/*.js'],
        // the location of the resulting JS file
          dest: 'dist/restitute.js'
        }
      }    
  });
  grunt.loadNpmTasks('grunt-contrib-concat');
};