'use strict';

let intervalId = null;
let startTime = null;
let endTime = null;

/**
 * Reindex main function
 *
 * @param {string} newIndexName - New index name
 * @param {string} oriIndexName - Old index name
 * @param {string} indexDetailsFile - Index details like settings and mappings
 * @param {string} esConfigFile - Elasticsearch configuration
 * @returns {Promise<void>}
 */
const reindexer = async ({
	newIndexName,
	oriIndexName,
	indexDetailsFile,
	esConfigFile,
}) => {
	if (
		typeof newIndexName !== 'string' ||
		typeof oriIndexName !== 'string' ||
		typeof indexDetailsFile !== 'string' ||
		typeof esConfigFile !== 'string'
	) {
		throw new Error('The type of arguments needs to be string');
	}

	startTime = performance.now();
	const elasticsearch = require('elasticsearch');
	const localhostEsClient = new elasticsearch.Client(JSON.parse(esConfigFile));

	localhostEsClient.ping(
		{
			requestTimeout: esConfigFile.ping,
		},
		(error) => {
			if (error) {
				throw error;
			}
		}
	);

	const data = JSON.parse(indexDetailsFile);
	await createIndex({ newIndexName, data, localhostEsClient });
	const taskId = await reIndex({
		newIndexName,
		oriIndexName,
		localhostEsClient,
	});
	intervalId = setInterval(() => {
		checkTask({ taskId, newIndexName, oriIndexName, localhostEsClient });
	}, 1000);
};

const createIndex = async ({ newIndexName, data, localhostEsClient }) => {
	if (await localhostEsClient.indices.exists({ index: newIndexName })) {
		throw new Error('The operation has been stopped because index exists.');
	}

	await localhostEsClient.indices
		.create({
			index: newIndexName,
			includeTypeName: true,
			body: data,
		})
		.catch(async (error) => {
			await deleteNewIndex({ newIndexName, localhostEsClient });
			console.log(error);
			throw new Error('There are some errors in createIndex function.');
		});
};

const reIndex = ({ newIndexName, oriIndexName, localhostEsClient }) => {
	return new Promise((resolve, reject) => {
		localhostEsClient
			.reindex({
				waitForCompletion: false, // Prevent timeout error
				body: {
					conflicts: 'proceed',
					source: {
						index: oriIndexName,
					},
					dest: {
						index: newIndexName,
					},
				},
			})
			.then((res) => {
				const taskId = res.task;
				resolve(taskId);
			})
			.catch(async (error) => {
				await deleteNewIndex({ newIndexName, localhostEsClient });
				console.log(error);
				reject(new Error('There are some errors in reIndex function.'));
			});
	});
};

const checkTask = ({
	taskId,
	newIndexName,
	oriIndexName,
	localhostEsClient,
}) => {
	return new Promise((resolve, reject) => {
		localhostEsClient.tasks
			.get({
				taskId: taskId,
				waitForCompletion: false,
			})
			.then(async (res) => {
				console.log(res);
				if (res.completed) {
					await clearInterval(intervalId);
					await deleteOriIndex({ oriIndexName, localhostEsClient });
					console.log('Reindex Done :)');
					endTime = performance.now();
					console.log(
						`Reindex took ${((endTime - startTime) / 1000) % 60} seconds`
					);
					resolve();
				}
			})
			.catch(async (error) => {
				await deleteNewIndex({ newIndexName, localhostEsClient });
				console.log(error);
				reject(new Error('There are some errors in checkTask function.'));
			});
	});
};

const deleteNewIndex = ({ newIndexName, localhostEsClient }) => {
	return new Promise((resolve, reject) => {
		localhostEsClient.indices
			.delete({
				index: newIndexName,
			})
			.then(() => {
				console.log(
					'Falling back... The uncompleted new index has been removed.'
				);
				resolve();
			})
			.catch((error) => {
				console.log(error);
				reject(new Error('There are some errors in deleteNewIndex function.'));
			});
	});
};

const deleteOriIndex = ({ oriIndexName, localhostEsClient }) => {
	return new Promise((resolve, reject) => {
		localhostEsClient.indices
			.delete({
				index: oriIndexName,
			})
			.then(() => {
				console.log('Delete original index successfully!');
				resolve();
			})
			.catch((error) => {
				console.log(error);
				reject(new Error('There are some errors in deleteOriIndex function.'));
			});
	});
};

module.exports = reindexer;
