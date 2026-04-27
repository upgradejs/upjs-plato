'use strict';

const {resolve} = require('path');
const {ESLint} = require('eslint');

async function process(source, options, info, projectPath) {
	var results = await lint(source, options, info.file, projectPath);

	var report = generateReport(results);

	return report;
}

function generateReport(data) {
	var out = {
		messages: []
	};

	function addResultToMessages(result) {

		let severityMap = {
			0: 'off',
			1: 'warn',
			2: 'error'
		};

		out.messages.push({
			severity: severityMap[result.severity],
			line: result.line,
			column: result.column,
			message: result.message,
			fix: result.fix || {}
		});
	}

	data.results.forEach(addResultToMessages);
	return out;
}

async function lint(source, options, file, projectPath) {
	if (typeof options === 'boolean') {
		options = null;
	}
	var data = [];

  // Remove potential Unicode BOM.
	source = source.replace(/^\uFEFF/, '');

  const eslint = new ESLint({
    overrideConfig: options,
    useEslintrc: false,
    cache: false,
    errorOnUnmatchedPattern: false
  });

  try {
    const lintResults = await eslint.lintText(source, {filePath: file});
    return {
      results: lintResults[0].messages || [],
      data: data
    };
  } catch (err) {
    console.error(err);
  }
	return {
		results: [],
		data: data
	};
}

exports.process = process;
