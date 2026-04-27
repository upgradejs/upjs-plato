const { getLockFilesExistence} = require('../../util');
const { execSync } = require( 'child_process');

function generateYarnAuditReport(projectRootPath) {
	const originalCwd = process.cwd();

	try {
		execSync(`yarn audit --cwd "${projectRootPath}" --json | ${originalCwd}/node_modules/.bin/yarn-audit-html`);
	} catch (err) {
		console.log('generateYarnAuditReport error: ', err);
	}
}

function generateNpmAuditReport(projectRootPath) {
	const originalCwd = process.cwd();
	process.chdir(projectRootPath);

	try {
		execSync(`npm audit --json | ${originalCwd}/node_modules/.bin/npm-audit-html`);
	} catch (err) {
		console.log('generateNpmAuditReport error: ', err);
	} finally {
		process.chdir(originalCwd);
	}
}

const performAudit = ({ projectRoot }) => {
	const { packageLockExist, yarnLockExist } = getLockFilesExistence(projectRoot);

  	if (yarnLockExist) {
		generateYarnAuditReport(projectRoot);
	} else if (packageLockExist) {
		generateNpmAuditReport(projectRoot);
	} else {
		// pnpm support goes here
		console.log("audit report for pnpm not supported")
	}
};

exports.process = performAudit;
