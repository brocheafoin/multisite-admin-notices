module.exports = function( grunt ) {

	require('load-grunt-tasks')(grunt);

	// Project configuration
	grunt.initConfig( {
		pkg:    grunt.file.readJSON( 'package.json' ),
		jshint: {
			options: {
				reporter: require('jshint-stylish'),
				globals: {
					"MSAN_SCRIPT_DEBUG": false,
				},
				 '-W020': true, //Read only - error when assigning EO_SCRIPT_DEBUG a value.
			},
			all: [ 'assets/js/*.js', '!assets/js/*.min.js', '!assets/js/vendor/**.js' ]
  		},

		uglify: {
			all: {
				files: [{
					expand: true,     // Enable dynamic expansion.
					src: ['assets/js/*.js', '!assets/js/*.min.js', '!assets/vendor/*.js'],
					ext: '.min.js',   // Dest filepaths will have this extension.
				}]
			},
			options: {
				compress: {
					global_defs: {
						"MULTISITE_ADMIN_NOTICES_SCRIPT_DEBUG": false,
					},
					dead_code: true
		      		},
				banner: '/*! <%= pkg.title %> - v<%= pkg.version %>\n' +
					' * <%= pkg.homepage %>\n' +
					' */\n',
				mangle: {
					except: ['jQuery']
				}
			},
		},

		
		cssmin: {
			options: {
				banner: '/*! <%= pkg.title %> - v<%= pkg.version %>\n' +
					' * <%= pkg.homepage %>\n' +
					' */\n'
			},
			minify: {
				expand: true,
				
				src: ['assets/css/*.css', '!assets/css/*.min.css'],
				
				ext: '.min.css'
			}
		},
		watch:  {
			
			styles: {
				files: ['assets/css/src/*.css'],
				tasks: ['cssmin'],
				options: {
					debounceDelay: 500
				}
			},
			
    			readme: {
    	    			files: ['readme.txt'],
    	    			tasks: ['wp_readme_to_markdown'],
    	    			options: {
					spawn: false,
				},
    	  		},
		      	scripts: {
				files: ['assets/js/*.js'],
				tasks: ['newer:jshint','newer:uglify'],
    	   			 options: {
					spawn: false,
				},
			},
		},
		clean: {
			main: ['build/<%= pkg.name %>']
		},
		copy: {
			// Copy the plugin to a versioned release directory
			main: {
				src:  [
					'**',
					'!node_modules/**',
					'!build/**',
					'!.git/**',
					'!.sass-cache/**',
					'!assets/css/src/**',
					'!assets/js/src/**',
					'!assets/img/src/**',
					'!Gruntfile.js',
					'!package.json',
					'!.gitignore',
					'!.gitmodules',
					'!tests/**',
					'!vendor/**',
					'!*~'
				],
				dest: 'build/<%= pkg.name %>/'
			}		
		},
		compress: {
			main: {
				options: {
					mode: 'zip',
					archive: './build/multisite_admin_notices.<%= pkg.version %>.zip'
				},
				expand: true,
				cwd: 'build/<%= pkg.name %>/',
				src: ['**/*'],
				dest: 'multisite_admin_notices/'
			},	
		},

		po2mo: {
			files: {
        			src: 'languages/*.po',
				expand: true,
			},
		},

		pot: {
			options:{
	        		text_domain: '<%= pkg.name %>',
		        	dest: 'languages/',
				keywords: [
					'__:1',
					'_e:1',
					'_x:1,2c',
					'esc_html__:1',
					'esc_html_e:1',
					'esc_html_x:1,2c',
					'esc_attr__:1', 
					'esc_attr_e:1', 
					'esc_attr_x:1,2c', 
					'_ex:1,2c',
					'_n:1,2', 
					'_nx:1,2,4c',
					'_n_noop:1,2',
					'_nx_noop:1,2,3c'
				],
    			},
	    	files:{
			src:  [
				'**/*.php',
				'!node_modules/**',
				'!build/**',
				'!tests/**',
				'!vendor/**',
				'!*~',
			],
		expand: true,
    		}
    	},

	checktextdomain: {
		options:{
			text_domain: '<%= pkg.name %>',
			correct_domain: true,
			keywords: [
				'__:1,2d',
				'_e:1,2d',
				'_x:1,2c,3d',
				'esc_html__:1,2d',
				'esc_html_e:1,2d',
				'esc_html_x:1,2c,3d',
				'esc_attr__:1,2d', 
				'esc_attr_e:1,2d', 
				'esc_attr_x:1,2c,3d', 
				'_ex:1,2c,3d',
				'_n:1,2,4d', 
				'_nx:1,2,4c,5d',
				'_n_noop:1,2,3d',
				'_nx_noop:1,2,3c,4d'
			],
		},
		files: {
			src:  [
				'**/*.php',
				'!node_modules/**',
				'!build/**',
				'!tests/**',
				'!vendor/**',
				'!*~',
			],
			expand: true,
		},
	},

	wp_readme_to_markdown: {
		convert:{
			files: {
				'readme.md': 'readme.txt'
			},
		},
	},

	checkrepo: {
		deploy: {
			tag: {
				eq: '<%= pkg.version %>',    // Check if highest repo tag is equal to pkg.version
			},
			tagged: true, // Check if last repo commit (HEAD) is not tagged
			clean: true,   // Check if the repo working directory is clean
        	}
	},
    

} );
	
	// Default task.
	
	grunt.registerTask( 'default', ['jshint', 'uglify', 'cssmin' ] );
		
	grunt.registerTask( 'test', [ 'jshint', 'checktextdomain' ] );

	grunt.registerTask( 'build', [ 'test', 'newer:uglify', 'pot', 'newer:po2mo', 'wp_readme_to_markdown', 'clean', 'copy' ] );

	grunt.registerTask( 'deploy', [ 'checkbranch:master', 'checkrepo:deploy', 'build', 'compress' ] );

	grunt.util.linefeed = '\n';
};
