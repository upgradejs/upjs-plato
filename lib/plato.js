/*
 * plato
 * https://github.com/es-analysis/plato
 *
 * Copyright (c) 2012 Jarrod Overson
 * Licensed under the MIT license.
 *
 * es6-plato
 * https://github.com/es-analysis/es6-plato
 * updated from plato, by the-simian (Jesse Harlin)
 * Licensed under the MIT license.
 */

'use strict';

// node api
var path = require('path');

// node api with sugar
var fs = require('fs-extra');

// vendor
var _ = require('lodash');
var glob = require('globby');
var unixify = require('unixify');
var preload = require('plugin-preloader').default;
var GitChurn = require('git-churn-js').default;

var eslintBase = require('./eslintbase');

// local lib
var util = require('./util'),
	OverviewHistory = require('./models/OverviewHistory'),
	FileHistory = require('./models/FileHistory'),
	Logger = require('./logger'),
	perFileReporters = {
		complexity: require('./reporters/complexity'),
    	eslint: require('./reporters/eslint')
	},
	auditReport = require('./reporters/dependencies/audit'),
	compatibilityReport = require('./reporters/dependencies/compatibility'),
	outdatedReport = require('./reporters/dependencies/outdated');

var overviewTemplate = __dirname + '/templates/overview.html',
	displayTemplate = __dirname + '/templates/display.html',
	fileTemplate = __dirname + '/templates/file.html',
	assets = __dirname + '/assets/',
	fileDir = 'files';

var log = new Logger(Logger.WARNING);

function getConfig(path) {
  if (path.endsWith('rc')) {
    const content = fs.readFileSync(path, { encoding :'utf8' });
    return content.length ? JSON.parse(content) : {};
  }
  return require(path);
}

async function inspect(files, outputDir, options, done) {
  	let _inputPattern = files;
	done = done || function noop() {};

	if (!files) {
		console.log('no files');
		return;
	}

	function patternToFile(pattern) {
		let _path = unixify(pattern);
		var t = glob.sync(_path);
		return t;
	}

	files = files instanceof Array ? files : [files];
	files = _
		.chain(files)
		.map(patternToFile)
		.flatten()
		.value();

	if (!files.length) {
		console.log('No files were found, check your glob,' + _inputPattern + '. ( You may need to put it in quotes if you are on Windows )');
		return;
	}

	console.log('Processing ',files.length, ' files');

	var flags = {
		churn: ('gitPath' in options),
		complexity: {
			sourceType: 'module',
			ecmaVersion: 6,
			loc: true,
			newmi: true,
			range: true,
			babelConfig: options.babelConfig
				? getConfig(path.resolve(options.babelConfig))
				: undefined,
		},
		eslint: options.eslintConfig
			? getConfig(path.resolve(options.eslintConfig))
			: eslintBase
	};

	if (options.babelConfig || options.eslintConfig) {
    preload({ babel: options.babelConfig ? flags.complexity.babelConfig : undefined, eslint: options.eslintConfig ? flags.eslint : undefined });
	}

	function cloneOptsAtFlag(flag) {
		if (flag in options) {
			if (typeof options[flag] === 'boolean' && flag === 'eslint') {
				flags[flag] = options[flag];
			} else {
				flags[flag] = _.extend({}, flags[flag], options[flag]);
			}
		}
	}

	Object.keys(flags).forEach(cloneOptsAtFlag);

	if (options.q) {
		log.level = Logger.ERROR;
	}

	if (options.date) {
		// if we think we were given seconds
		if (options.date < 10000000000) {
			options.date = options.date * 1000;
		}
		options.date = new Date(options.date);
	}

	var reports = [];

	var fileOutputDir = outputDir ? path.join(outputDir, fileDir) : false;

	var commonBasePath = util.findCommonBase(files);

	var gitChurn = null;

	if (flags.churn) {
		gitChurn = new GitChurn({ directory: options.gitPath });
	}

	if (!options.projectRoot) {
		options.projectRoot = process.cwd();
	}

	if (options.projectRoot) {
		auditReport.process(options);
		compatibilityReport.process(options);
		outdatedReport.process(options);
	}

	async function runReports(files, done) {
		const reportPromises = files.map(async function reportEachFile(file) {
		if (options.exclude && options.exclude.test(file)) {
			return;
		}

		if (options.recurse && fs.statSync(file).isDirectory()) {
			files = fs.readdirSync(file).map(function resolveFile(innerFile) {
				return path.join(file, innerFile);
			});
			await runReports(files);
		} else if (file.match(/\.(js|jsx|mjs|es6|ts|tsx)$/)) {
			log.info('Reading "%s"', file);

			var fileShort = file.replace(commonBasePath, '');
			var fileSafe = fileShort.replace(/[^a-zA-Z0-9]/g, '_');
			var source = fs.readFileSync(file).toString();
			var trimmedSource = source.trim();
			if (!trimmedSource) {
				log.info('Not parsing empty file "%s"', file);
				return;
			}

			// if skip empty line option
			if (options.noempty) {
				source = source.replace(/^\s*[\r\n]/gm, '');
			}

			// if begins with shebang
			if (source[0] === '#' && source[1] === '!') {
				source = '//' + source;
			}
			var report = {
				info: {
					file: file,
					fileShort: fileShort,
					fileSafe: fileSafe,
					link: fileDir + '/' + fileSafe + '/index.html'
				}
				};

			var filePath = path.resolve(report.info.file);

			var churn = gitChurn && gitChurn.getByPath(filePath);
			if (churn) {
				report.churn = churn;
			}
			var error = false;
			await Promise.all(_.map(perFileReporters, async function processReporter(reporter, name) {
				if (!flags[name]) {
					return;
				}
				try {
					report[name] = await reporter.process(source, flags[name], report.info, _inputPattern[0]);
				} catch (e) {
					error = true;
					log.error('Error reading file %s: ', file, e.toString());
					log.error(e.stack);
				}
			}));

			if (error) {
				return;
			}

			reports.push(report);
			if (fileOutputDir) {
				var outdir = path.join(fileOutputDir, report.info.fileSafe);
				if (!fs.existsSync(outdir)) {
					fs.mkdirSync(outdir);
				}
				writeFileReport(outdir, report, source, options);
			}
		}
		});

		await Promise.all(reportPromises);
		if (done) {
			done();
		}
	}

	if (!fileOutputDir) {
		await runReports(files, function() {
			done(reports);
		});
	} else {
		fs.mkdirp(fileOutputDir, async function() {
			await runReports(files, function() {
				var reportFilePrefix = path.join(outputDir, 'report');
				var overview = path.join(outputDir, 'index.html');
				var wallDisplay = path.join(outputDir, 'display.html');
				var dependenciesAudit = path.join(outputDir, 'dependencies-audit.html');
				var dependenciesCompatibility = path.join(outputDir, 'dependencies-compatibility.html');
				var dependenciesOutdated = path.join(outputDir, 'dependencies-outdated.html');

				fs.copy(assets, path.join(outputDir, 'assets'), function() {
					var overviewReport = getOverviewReport(reports);
					updateHistoricalOverview(reportFilePrefix, overviewReport, options);
					writeReport(reportFilePrefix, overviewReport);
					const reportsPairs = [
						[overview, overviewTemplate],
						[wallDisplay, displayTemplate],
					];

					// write overview reports
					reportsPairs.forEach(([rpt, template]) => {
						writeOverview(
							rpt,
							overviewReport,
							{
								title: options.title,
								flags: flags
							},
							template
						);
					})

					// move HTML reports
					if (options.projectRoot) {
						if (fs.existsSync('./yarn-audit.html')) {
							fs.moveSync('./yarn-audit.html', dependenciesAudit, { overwrite: true,  })
						}
						if (fs.existsSync('./dependencies-compatibility.html')) {
							fs.moveSync('./dependencies-compatibility.html', dependenciesCompatibility, { overwrite: true })
						}
						if (fs.existsSync('./yarn-outdated.html')) {
							fs.moveSync('./yarn-outdated.html', dependenciesOutdated, { overwrite: true })
						}
					}
					done(reports);
				});
			});
		});
	}
}

// Filters out information unused in the overview for space/performance
function getOverviewReport(reports) {
	var culledReports = [];
	var summary = {
		total: {
			eslint: 0,
			sloc: 0,
			maintainability: 0,
			churn: 0
		},
		average: {
			sloc: 0,
			maintainability: 0
		}
	};

	reports.forEach(function(report) {
		// clone objects so we don't have to worry about side effects
		summary.total.sloc += report.complexity.aggregate.sloc.physical;
		summary.total.maintainability += report.complexity.maintainability;

		var aggregate = _.cloneDeep(report.complexity.aggregate);
		var reportItem = {};
		reportItem.info = report.info;
		if (report.eslint) {
			summary.total.eslint += report.eslint.messages.length;
			reportItem.eslint = {
				messages: report.eslint.messages.length
			};
		}
		if (report.complexity) {
			reportItem.complexity = {
				aggregate: aggregate,
				module: report.complexity.module,
				module_safe: report.complexity.module_safe,
				maintainability: _.cloneDeep(report.complexity.maintainability)
			};
		}
		if (report.churn) {
			summary.total.churn += report.churn.changes;
			reportItem.churn = report.churn.changes;
		}
		culledReports.push(reportItem);
	});

	summary.average.sloc = Math.round(summary.total.sloc / reports.length);
	summary.average.eslint = (summary.total.eslint / reports.length).toFixed(2);
	summary.average.maintainability = (
		summary.total.maintainability / reports.length
	).toFixed(2);

	return {
		summary: summary,
		reports: culledReports
	};
}

function updateHistoricalOverview(outfilePrefix, overview, options) {
	var existingData =
		util.readJSON(outfilePrefix + '.history.json', options) || {};
	var history = new OverviewHistory(existingData);
	history.addReport(overview, options.date);
	writeReport(outfilePrefix + '.history', history.toJSON(), '__history');
}

function updateHistoricalReport(outfilePrefix, overview, options) {
	var existingData =
		util.readJSON(outfilePrefix + '.history.json', options) || {};
	var history = new FileHistory(existingData);
	overview.date = options.date;
	history.addReport(overview, options.date);
	writeReport(outfilePrefix + '.history', history.toJSON(), '__history');
}

function writeFile(file, source) {
	log.info('Writing file "%s".', file);
	fs.writeFileSync(file, source, 'utf8');
}

function writeReport(outfilePrefix, report, exportName) {
	var formatted = util.formatJSON(report);

	writeFile(outfilePrefix + '.json', formatted);

	exportName = exportName || '__report';

	var module = exportName + ' = ' + formatted;

	writeFile(outfilePrefix + '.js', module);
}

function writeOverview(outfile, report, options, templatePath) {
	var overviewSource = fs.readFileSync(templatePath).toString();

	var parsed = _.template(overviewSource)({
		report: report,
		options: options
	});
	writeFile(outfile, parsed);
}

function writeFileReport(outdir, report, source, options) {
	var overviewSource = fs.readFileSync(fileTemplate).toString();

	var parsed = _.template(overviewSource)({
		source: util.escapeHTML(source),
		report: report
	});
	var indexPath = path.join(outdir, 'index.html');
	var outfilePrefix = path.join(outdir, 'report');

	writeFile(indexPath, parsed);
	updateHistoricalReport(outfilePrefix, report, options);
	writeReport(outfilePrefix, report);
}

exports.getOverviewReport = getOverviewReport;
exports.inspect = inspect;
