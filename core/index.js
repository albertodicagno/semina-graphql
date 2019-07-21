const request = require('request');
const path = require('path');

const BASE_URL = process.env.BASE_URL;

const parseDirection = (input) => {
    return (input == 'R') ? -1 : ((input == 'A') ? 1 : 0);
};

const parseDate = (input) => {
    input = input.replace("/Date(", "").replace(")/", "");
    
    let parts, tzCoeff;
    if (input.indexOf("-") > 0) {
        tzCoeff = -1;
        parts = input.split("-");
    } else if (input.indexOf("+") > 0){
        tzCoeff = 1;
        parts = input.split("+");
    }
    const tzOffset = parseInt(parts[1]);
    const timestamp = parseInt(parts[0]) + (tzOffset * 3600 * tzCoeff);
    return new Date(timestamp);
};

const sanitizeRide = (corsa) => {
    corsa.Direzione = parseDirection(corsa.Direzione);
    corsa.Orario = parseDate(corsa.Orario);
    return corsa;
};

const getRidesByLine = async (line) => {
    let rides = await fetchData('/OrariBus/v2.1/OpenDataService.svc/REST/ServizioGiornaliero/' + line + '/');
    return new Promise((resolve, reject) => {
        if (rides && rides.length > 0) {
            resolve(rides.map(sanitizeRide));
        } else {
            reject(new Error("No rides available"));
        }
    });
};

const getNearbyStops = async (lat, lon, range) => {
    if(range == undefined) range = "";
    return fetchData(`/OrariBus/v2.1/OpenDataService.svc/REST/rete/FermateVicine/${lat}/${lon}/${range}`);
};

const getLines = async() => {
    return fetchData('/OrariBus/v2.1/OpenDataService.svc/REST/rete/Linee');
};

const getRidesCount = async() => {
    return fetchData('/OrariBus/v2.1/OpenDataService.svc/REST/NumCorseGiorno')
};

const fetchData = async (endpoint) => {
    const callUrl = BASE_URL + endpoint;
    return new Promise((resolve, reject) => {
        request.get(callUrl, {}, (error, response, body) => {
            let res;
            try {
                res = JSON.parse(body);
            } catch (err){
                reject(new Error("Unexpected response from data source"));
            }
            if (error) {
                reject(error);
            } else if (!res || res.length <= 0){
                reject(new Error("No result"));
            } else {
                resolve(res);
            }
        });
    });
};

module.exports = {
    getLines: getLines,
    getRidesByLine: getRidesByLine,
    getRidesCount: getRidesCount,
    getNearbyStops: getNearbyStops
};