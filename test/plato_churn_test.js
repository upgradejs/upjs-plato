'use strict';

var test = require('node:test');
var assert = require('node:assert');
var fs = require('node:fs');
var os = require('node:os');
var path = require('node:path');

var plato = require('../lib/plato');

var projectRoot = path.resolve(__dirname, '..');
var fixture = path.join('test', 'fixtures', 'a.js');
var isGitRepo = fs.existsSync(path.join(projectRoot, '.git'));

test('churn is collected by default when no gitPath is provided', { skip: !isGitRepo && 'requires a git checkout' }, function(t, done) {
	plato.inspect([fixture], null, {}, function(reports) {
		assert.strictEqual(reports.length, 1);
		var report = reports[0];
		assert.ok(report.churn, 'report.churn should be set for a tracked file');
		assert.ok(report.churn.changes > 0, 'report.churn.changes should be > 0 for a tracked file');

		var overview = plato.getOverviewReport(reports);
		assert.ok(overview.summary.total.churn > 0, 'overview total.churn should be > 0');
		done();
	});
});

test('plato does not crash when gitPath is not a git repo', function(t, done) {
	var tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'plato-nogit-'));
	t.after(function() {
		fs.rmSync(tmpDir, { recursive: true, force: true });
	});

	plato.inspect([fixture], null, { gitPath: tmpDir, projectRoot: tmpDir }, function(reports) {
		assert.strictEqual(reports.length, 1);
		assert.strictEqual(reports[0].churn, undefined, 'no churn expected when gitPath is not a git repo');

		var overview = plato.getOverviewReport(reports);
		assert.strictEqual(overview.summary.total.churn, 0);
		done();
	});
});

test('files outside git history do not crash the per-file reporter', { skip: !isGitRepo && 'requires a git checkout' }, function(t, done) {
	var tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'plato-untracked-'));
	var tmpFile = path.join(tmpDir, 'untracked.js');
	fs.writeFileSync(tmpFile, 'function add(a, b) { return a + b; }\nmodule.exports = add;\n');

	t.after(function() {
		fs.rmSync(tmpDir, { recursive: true, force: true });
	});

	// gitPath points at a real git repo, but the analyzed file is not in
	// that repo's history — getByPath throws and should be swallowed.
	plato.inspect([tmpFile], null, { gitPath: projectRoot, projectRoot: projectRoot }, function(reports) {
		assert.strictEqual(reports.length, 1);
		assert.strictEqual(reports[0].churn, undefined, 'no churn expected for untracked file');
		done();
	});
});

test('explicit gitPath option still works as an override', { skip: !isGitRepo && 'requires a git checkout' }, function(t, done) {
	plato.inspect([fixture], null, { gitPath: projectRoot }, function(reports) {
		assert.strictEqual(reports.length, 1);
		assert.ok(reports[0].churn, 'churn should be collected when gitPath is explicit');
		assert.ok(reports[0].churn.changes > 0);
		done();
	});
});
