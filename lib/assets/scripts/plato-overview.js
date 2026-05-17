/*global $:false, _:false, Morris:false, __report:false, __history:false, __options: false */
/*jshint browser:true*/

$(function() {
	'use strict';

	// bootstrap popover
	$('[rel=popover]').popover();

	// @todo put client side templates into a JST
	var fileGraphTemplate = _.template(
		'<div class="threshold-<%= threshold %>">' +
    '<label><%= label %></label>' +
    '<span class="horizontal-bar" style="width:<%= width %>px"></span>' +
    '<span class="chart-value"><%= value %></span>' +
    '</div>'
	);

	var horizontalBar = function(orig, width, label, thresholds) {
		var threshold = 0;
		for (var i = thresholds.length - 1; i > -1; i--) {
			if (orig > thresholds[i]) {
				threshold = i + 1;
				break;
			}
		}
		return fileGraphTemplate({
			width: width,
			label: label,
			threshold: threshold,
			value: orig
		});
	};

	function drawFileCharts() {
		// @todo make a jQuery plugin to accomodate the horizontalBar function
		$('.js-file-chart').each(function() {
			var el = $(this),
				width = el.width() - 130; // @todo establish max width of graph in plugin

			el.empty();

			var value = el.data('complexity');
			el.append(horizontalBar(value, Math.min(value * 2, width), 'complexity', [5, 10]));

			value = el.data('sloc');
			el.append(horizontalBar(value, Math.min(value, width), 'sloc', [400, 600]));

			value = el.data('bugs');
			el.append(horizontalBar(value, Math.min(value * 5, width), 'est errors', [1, 5]));

			if (__options.flags.eslint) {
				value = el.data('lint');
				el.append(horizontalBar(value, Math.min(value * 5, width), 'lint errors', [1, 10]));
			}

			if (__options.flags.churn) {
				value = el.data('churn');
				el.append(horizontalBar(value, Math.min(value * 5, width), 'churn', [10, 50]));
			}
		});
	}

	function drawOverviewCharts(reports) {

		var maintainability = {
			element: 'chart_maintainability',
			data: [],
			xkey: 'label',
			ykeys: ['value'],
			ymax: 100,
			ymin: 0,
			labels: ['Maintainability'],
			barColors: ['#ff9b40']
		};
		var sloc = {
			element: 'chart_sloc',
			data: [],
			xkey: 'label',
			ykeys: ['value'],
			ymax: 400,
			labels: ['Lines'],
			barColors: ['#1f6b75']
		};
		var bugs = {
			element: 'chart_bugs',
			data: [],
			xkey: 'label',
			ykeys: ['value'],
			labels: ['Errors'],
			ymax: 20,
			barColors: ['#ff9b40']
		};
		var lint = {
			element: 'chart_lint',
			data: [],
			xkey: 'label',
			ykeys: ['value'],
			labels: ['Errors'],
			ymax: 20,
			barColors: ['#1f6b75']
		};

		reports.forEach(function(report) {

			// @todo shouldn't need this, 'auto [num]' doesn't seem to work : https://github.com/oesmith/morris.js/issues/201
			sloc.ymax = Math.max(sloc.ymax, report.complexity.aggregate.sloc.physical);
			bugs.ymax = Math.max(bugs.ymax, report.complexity.aggregate.halstead.bugs.toFixed(2));


			sloc.data.push({
				value: report.complexity.aggregate.sloc.physical,
				label: report.info.fileShort
			});
			bugs.data.push({
				value: report.complexity.aggregate.halstead.bugs.toFixed(2),
				label: report.info.fileShort
			});
			maintainability.data.push({
				value: report.complexity.maintainability ? report.complexity.maintainability.toFixed(2) : 0,
				label: report.info.fileShort
			});

			console.log(report);

			lint.data.push({
				value: report.eslint && report.eslint.messages,
				label: report.info.fileShort
			});
		});

		function onGraphClick(i) {
			// If the i is not set, we jump to the last file in the list. This
			// preserves a behavior from Morris v1. I expect Plato V1 to be deprecated
			// and this hack is mearly to preserve the casper tests.
			if (i == null || isNaN(i)) {
				i = __report.reports.length - 1;
			}
			document.location = __report.reports[i].info.link;
		}

		var charts = [
			Morris.Bar(bugs),
			Morris.Bar(sloc),
			Morris.Bar(maintainability)
		];

		if (__options.flags.eslint) {charts.push(Morris.Bar(lint));}

		charts.forEach(function(chart) {
			chart.on('click', onGraphClick);
		});
		return charts;
	}

	function drawHistoricalChart(history) {
		var data = _.map(history, function(record) {
			var date = new Date(record.date);
			return {
				date: date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate(),
				average_maintainability: parseFloat(record.average.maintainability),
				average_sloc: record.average.sloc
			};
		}).slice(-20);
		Morris.Line({
			element: 'chart_historical_sloc',
			data: data,
			xkey: 'date',
			ykeys: ['average_sloc'],
			labels: ['Average Lines'],
			parseTime: false
		});
		Morris.Line({
			element: 'chart_historical_maint',
			data: data,
			xkey: 'date',
			ykeys: ['average_maintainability'],
			labels: ['Maintainability'],
			ymax: 100,
			parseTime: false
		});
	}

	var COLOR = {
		'A' : '#00B50E',
		'B': '#53D700',
		'C': '#FDF400',
		'D': '#FF6C00',
		'F': '#C40009'
	};

	function getRating(score) {
		switch (true) {
		case score <= 2: return 'A';
		case score <= 4: return 'B';
		case score <= 8: return 'C';
		case score <= 16: return 'D';
		default: return 'F';
		}
	}

	var wasChurnComplexityInitialized = false;

	function drawChurnChart(reports) {
		wasChurnComplexityInitialized = true;
		$('#chart_churn-complexity').highcharts({
			chart: {
				type: 'scatter',
				zoomType: 'xy'
			},
			title: {
				text: ''
			},
			xAxis: {
				title: {
					enabled: true,
					text: 'Churn'
				},
				floor: 0,
				startOnTick: true,
				endOnTick: true
			},
			yAxis: {
				title: {
					text: 'Complexity'
				},
				floor: 0,
				startOnTick: true,
				endOnTick: true
			},
			plotOptions: {
				series: {
					turboThreshold: 0,
					cursor: 'pointer',
					events: {
						click: function(event) {
							window.open(event.point.link, '_blank');
						}
					}
				},
				scatter: {
					marker: {
						radius: 5,
						states: {
							hover: {
								enabled: true,
								lineColor: 'rgb(100,100,100)'
							}
						}
					},
					tooltip: {
						headerFormat: '<b>{point.key}</b><br>',
						pointFormat: '<p>Changed {point.x} times, with Cyclomatic score of {point.y}</p><br>',
						footerFormat: 'Click on point to view details'
					}
				}
			},
			series: [{
				showInLegend: false,
				color: 'steelblue',
				data: reports.map(function(report) {
					return {
						name: report.info.fileShort,
						x: report.churn,
						y: report.complexity.aggregate.cyclomatic,
						color: COLOR[getRating(report.complexity.aggregate.cyclomatic)],
						link: report.info.link
					};
				})
			}]
		});
	}

	function drawCharts() {
		$('.js-chart').empty();
		drawHistoricalChart(__history);
		drawOverviewCharts(__report.reports);
		drawFileCharts(__report.reports);
		if (__report.summary.total.churn && !wasChurnComplexityInitialized) {
			drawChurnChart(__report.reports);
		}
	}

	drawCharts();

	$(window).on('resize', _.debounce(drawCharts, 200));
});
