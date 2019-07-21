const restify = require('restify');
const core = require('../core');
const buildSchema = require('graphql').buildSchema;
const express_graphql = require('express-graphql');
const fs = require('fs');

const apiApp = restify.createServer();

const querySchemaString = fs.readFileSync(process.env.SCHEMA_FILE).toString();

const schema = buildSchema(querySchemaString);

var root = {
    servizioGiornaliero: ({ linea }) => {
        return core.getRidesByLine(linea);
    },
    linee: () => {
        return core.getLines();
    },
    numeroCorse: () => {
        return core.getRidesCount();
    },
    fermateVicine: ({lat, lon, range}) => {
        return core.getNearbyStops(lat, lon, range);
    },
};

apiApp.get('/api/v1', express_graphql({
    schema: schema,
    rootValue: root,
    graphiql: true
}));

apiApp.post('/api/v1', express_graphql({
    schema: schema,
    rootValue: root
}));

const start = (port) => {
    apiApp.listen(port);
};

module.exports = {
    start: start
};