const { readFileSync } = require('fs');
const nodemon = require('nodemon');
const gulp = require('gulp');
const sass = require('gulp-sass');
const del = require('del');
const tinyLR = require('tiny-lr');
const server = tinyLR();
const vinylPaths = require('vinyl-paths');
const sourcemaps = require('gulp-sourcemaps');
const rollup = require('rollup');
const rollupResolve = require('rollup-plugin-node-resolve');
const commonjs = require('rollup-plugin-commonjs');
const revdel = require('gulp-rev-delete-original');
const rev = require('gulp-rev');
const revRewrite = require('gulp-rev-rewrite');
const {
	terser
} = require('rollup-plugin-terser');

const {
	spawn: spawnRaw
} = require('child_process');

let hasRegisteredSIGINTHandler = false;
let spawnedProcesses = [];

function spawn(...args) {
	const spawnedProcess = spawnRaw(...args);

	spawnedProcesses.push(spawnedProcess);

	if (!hasRegisteredSIGINTHandler) {
		process.once('SIGINT', () => {
			for (const _spawnedProcess of spawnedProcesses) {
				_spawnedProcess.kill();
			}
		});

		hasRegisteredSIGINTHandler = true;
	}

	return spawnedProcess;
}

const clientDist = `dist/client`;

const paths = {
	dist: clientDist,
	manifest: `${clientDist}/rev-manifest.json`,
	copy: {
		input: [
			'src/client/*.*',
		],
		output: `${clientDist}`
	},
	copyVids: {
		input: [
			'src/client/vid/*.mp4'
		],
		output: `${clientDist}/vid`
	},
	copyFonts: {
		input: [
			'src/client/font/*.woff',
			'src/client/font/*.woff2'
		],
		output: `${clientDist}/font`
	},
	copyViews: {
		input: [
			'src/server/views/**/*',
		],
		output: `dist/server/views`
	},
	scripts: {
		input: 'src/client/js/*.js',
		output: `${clientDist}/js/`
	},
	styles: {
		input: 'src/client/css/*.scss',
		output: `${clientDist}/css/`
	},
	images: {
		input: [
			'src/client/img/**/*.jpg',
			'src/client/img/**/*.png',
			'src/client/img/**/*.svg'
		],
		output: `${clientDist}/img/`
	},
	server: 'dist/server/server.js'
};

const lrPort = 35729;

gulp.task('clean', () => {
	return gulp.src(paths.dist, {
			allowEmpty: true
		})
		.pipe(vinylPaths(del));
});

function triggerChange() {
	return new Promise(resolve => {
		tinyLR.changed(resolve, '');
	})
}

function sleep(ms = 1000) {
	return new Promise(resolve => {
		setTimeout(resolve, ms);
	})
}

function watchFiles(done) {
	gulp.watch(paths.copyViews.input, gulp.series([
		'clean:views',
		'copy:views',
		triggerChange
	]));

	gulp.watch('src/client/css/**/*.scss', gulp.series([
		'clean:css',
		'styles',
		triggerChange
	]));

	gulp.watch('src/client/js/**/*.js', gulp.series([
		'clean:js',
		'scripts',
		triggerChange
	]));

	nodemon({
		"script": paths.server,
		"ignore": [
			"src/",
			"dist/client/",
			"node_modules"
		],
		"delay": "100",
		"watch": [
			"dist/server/"
		],
		"ext": "js",
		"env": {
			"NODE_ENV": "development"
		},
		"execMap": {
			"js": "node -r source-map-support/register"
		}
	});

	const nodemonResult = nodemon.on('start', () => {
		done();
	}).on('restart', async files => {
		// If livereload triggers to early, the nodemon server may not have finished
		await sleep(500);
		triggerChange();
	});

	// Capture ^C
	process.once('SIGINT', function () {
		nodemonResult.emit('quit')
		nodemonResult.quitEmitted = true
	});

	nodemonResult.on('exit', () => {
		// Ignore exit event during restart
		if (nodemonResult.quitEmitted) {
			process.exit(0)
		}
	})
}

gulp.task('typescript:watch', done => {	
	spawn('./node_modules/.bin/tsc', ['-w', '--preserveWatchOutput'], {
		stdio: 'inherit'
	});

	done();
});

gulp.task('styles', () => {
	return gulp.src(paths.styles.input, {
			base: './src/client'
		})
		.pipe(sourcemaps.init())
		.pipe(sass({
			outputStyle: 'compressed'
		}).on('error', sass.logError))
		.pipe(rev())
		.pipe(sourcemaps.write('./'))
		.pipe(gulp.dest(paths.dist))
		.pipe(rev.manifest(`${paths.dist}/rev-manifest.json`, {
			merge: true
		}))
		.pipe(gulp.dest('.'));
});

gulp.task('scripts', async () => {
	/*
		Warning: The numWorkers property in the code below stops this failing on my VPS
			- By default, rollup-plugin-terser spawns workers...
				... Defaults to the number of CPUs minus 1.
			- As a result, the bundle promise.write call would never resolve
	*/
	const bundle = await rollup.rollup({
		input: 'src/client/js/main.js',
		plugins: [
			rollupResolve(),
			commonjs(),
			terser({
				numWorkers: 1
			})
		]
	});

	await bundle.write({
		file: paths.scripts.output + '/main.js',
		format: 'iife',
		name: 'library',
		sourcemap: true
	});

	await new Promise(resolve => {
		gulp.src(paths.scripts.output + '*', {
				base: paths.dist
			}).pipe(rev())
			.pipe(revdel())
			.pipe(gulp.dest(paths.dist))
			.pipe(rev.manifest(paths.manifest, {
				merge: true
			}))
			.pipe(gulp.dest('.'))
			.on('end', resolve);
	});

	const manifest = readFileSync(paths.manifest);

	function replaceJsIfMap(filename) {
		if (filename.includes('.map')) {
			return filename.replace('js/', '');
		}

		return filename;
	}

	await new Promise(resolve => {
		gulp.src(paths.scripts.output + '*.js', {
				base: paths.dist
			})
			.pipe(revRewrite({
				manifest,
				modifyUnreved: replaceJsIfMap,
				modifyReved: replaceJsIfMap
			}))
			.pipe(gulp.dest(paths.dist))
			.on('end', resolve);
	});
});

gulp.task('images', () => {
	return gulp.src(paths.images.input, {
			base: './src/client'
		})
		.pipe(rev())
		.pipe(gulp.dest(paths.dist))
		.pipe(rev.manifest(paths.manifest, {
			merge: true
		}))
		.pipe(gulp.dest('.'));
});

gulp.task('copy', () => {
	return gulp.src(paths.copy.input)
		.pipe(gulp.dest(paths.copy.output));
});

gulp.task('copy:vids', () => {
	return gulp.src(paths.copyVids.input)
		.pipe(gulp.dest(paths.copyVids.output));
});

gulp.task('copy:fonts', () => {
	return gulp.src(paths.copyFonts.input)
		.pipe(gulp.dest(paths.copyFonts.output));
});

gulp.task('copy:views', () => {
	return gulp.src(paths.copyViews.input)
		.pipe(gulp.dest(paths.copyViews.output));
});

gulp.task('clean:views', () => {
	return gulp.src(paths.copyViews.output, {
			allowEmpty: true
		})
		.pipe(vinylPaths(del));
});

gulp.task('clean:css', () => {
	return gulp.src(`${paths.dist}/css`, {
			allowEmpty: true
		})
		.pipe(vinylPaths(del));
});

gulp.task('clean:js', () => {
	return gulp.src(`${paths.dist}/js`, {
			allowEmpty: true
		})
		.pipe(vinylPaths(del));
});

gulp.task('lr', done => {
	server.listen(lrPort, error => {
		if (error) {
			console.error(error);
			throw new Error('Error with the Live Reload Task ', error);
		} else {
			console.log('Live Reload server started at ', lrPort);
			done();
		}
	});
});

gulp.task('typescript', () => new Promise((resolve, reject) => {
	const tsc = spawn('./node_modules/.bin/tsc', [], {
		stdio: 'inherit'
	});
	tsc.on('exit', (code) => {
		if (!code) {
			resolve();
		} else {
			reject();
		}
	});
}));

gulp.task('watch', gulp.parallel([watchFiles]));

gulp.task('default', gulp.series([
	'clean',
	'styles',
	'scripts',
	'images',
	'copy',
	'copy:vids',
	'copy:fonts',
	'copy:views',
	'lr',
	'watch',
	'typescript:watch'
]));

gulp.task('build', gulp.series([
	'clean',
	'styles',
	'scripts',
	'images',
	'copy',
	'copy:vids',
	'copy:fonts',
	'copy:views',
	'typescript'
]));