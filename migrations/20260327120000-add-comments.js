'use strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
let dbm;
let type;
let seed;
let Promise;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */
export const setup = function (options, seedLink) {
    dbm = options.dbmigrate;
    type = dbm.dataType;
    seed = seedLink;
    Promise = options.Promise;
};
export const up = function (db) {
    let filePath = path.join(__dirname, 'sqls', '20260327120000-add-comments-up.sql');
    return new Promise(function (resolve, reject) {
        fs.readFile(filePath, { encoding: 'utf-8' }, function (err, data) {
            if (err) return reject(err);
            console.log('received data: ' + data);
            resolve(data);
        });
    })
        .then(function (data) {
            return db.runSql(data);
        });
};
export const down = function (db) {
    let filePath = path.join(__dirname, 'sqls', '20260327120000-add-comments-down.sql');
    return new Promise(function (resolve, reject) {
        fs.readFile(filePath, { encoding: 'utf-8' }, function (err, data) {
            if (err) return reject(err);
            console.log('received data: ' + data);
            resolve(data);
        });
    })
        .then(function (data) {
            return db.runSql(data);
        });
};
export const _meta = {
    "version": 1
};