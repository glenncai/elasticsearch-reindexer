# <em><b> Elasticsearch Reindexer</b></em>

Automatically reindex in elasticsearch like a charm!

## Installation

```sh
npm i elasticsearch-reindexer

or 

yarn add elasticsearch-reindexer
```

## Usage

Create a file named `index.js` including the following code:

```javascript
const reindexer = require('elasticsearch-reindexer');
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

```

Create `index-details.json` and `esclient-config.json` files respectively. The former includes the details of the new
index like `settings` and `mappings`, and the latter includes the elasticsearch configuration. If you want to use the
same index name like old one, please swap the two index name and execute the file again.

Make sure that `node` is already installed in your system.

```sh
node index.js
```

WARNING: The original index (old index) will be deleted automatically after finished reindexing.

## Index Details Sample

```json
{
  "settings": {
    "number_of_shards": 1
  },
  "mappings": {
    "properties": {
      "field1": {
        "type": "text"
      }
    }
  }
}
```

## ES Configuration Sample

```json
{
  "esClientOptions": {
    "host": "localhost:9200",
    "log": "error",
    "auth": {
      "username": "",
      "password": ""
    }
  },
  "ping": 30000,
  "activeQueueTasks": 4
}

```

## Parameters

When use `reindexer` you can configure the following options via the parameter.

| Key                | Type   | Default | Description                                 |
|--------------------|--------|---------|---------------------------------------------|
| `newIndexName`     | string | None    | The new index name.                         |
| `oriIndexName`     | string | None    | The original index name (old index name).   |
| `indexDetailsFile` | string | None    | Index details like `mapping` and `setting`. |
| `esConfigFile`     | string | None    | Elasticsearch configuration.                |
