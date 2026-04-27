const { report } = require('depngn/report');
const { depngn } = require('depngn');

const performAudit = async ({ projectRoot, targetNode }) => {
	if (!targetNode) {
		return
	}
	try {
		const compatData = await depngn({ version: targetNode, cwd: projectRoot });
		await report(compatData, { reporter: 'html', reportDir: '.', reportFileName: 'dependencies-compatibility' });
	} catch (err) {
		console.error('compatibility audit error: ', err);
	}
};

exports.process = performAudit;
