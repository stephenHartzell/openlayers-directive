module.exports = function(grunt) {

    grunt.initConfig({
        concat: {
            dist: {
                src: ['src/directives/openlayers.js',
                    'src/directives/center.js',
                    'src/directives/layer.js',
                    'src/directives/events.js',
                    'src/directives/path.js',
                    'src/directives/view.js',
                    'src/directives/control.js',
                    'src/directives/marker.js',
                    'src/services/olData.js',
                    'src/services/olHelpers.js',
                    'src/services/olMapDefaults.js'
                ],
                dest: 'dist/angular-openlayers-directive.js'
            }
        },
        cssmin: {
            target: {
                files: {
                    'dist/angular-openlayers-directive.css': ['css/*']
                }
            }
        },
        uglify: {
            options: {
                mangle: false
            },
            complete: {
                files: {
                    'dist/angular-openlayers-directive.min.js': ['dist/angular-openlayers-directive.js']
                }
            }
        },
        clean: {
            'all': ["dist/angular-openlayers-directive.js","dist/angular-openlayers-directive.min.js","dist/angular-openlayers-directive.css"]
        },
        watch:{
            scripts: {
                files: ['src/directives/*.js','src/services/*.js'],
                tasks: ['clean','cssmin','concat','uglify']
            }
        }
    });
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.registerTask('default', ['clean','cssmin','concat','uglify']);
};
