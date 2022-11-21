const reindexer = require('../src');
const fs = require('fs');

const indexDetailsFile = fs.readFileSync('index-details.json', 'utf-8');
const esConfigFile = fs.readFileSync('esclient-config.json', 'utf-8');

reindexer({
	newIndexName: 'test_clone',
	oriIndexName: 'test',
	indexDetailsFile: indexDetailsFile,
	esConfigFile: esConfigFile,
}).catch((error) => {
	console.log(error);
});
