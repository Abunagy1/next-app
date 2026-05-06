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
export const setup = function (options, seedLink) {
    dbm = options.dbmigrate;
    type = dbm.dataType;
    seed = seedLink;
    Promise = options.Promise;
};
export const up = function (db) {
    const filePath = path.join(__dirname, 'sqls', '20260328120000-add-comment-reactions-up.sql');
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, { encoding: 'utf-8' }, (err, data) => {
            if (err) return reject(err);
            resolve(data);
        });
    }).then(data => db.runSql(data));
};
export const down = function (db) {
    const filePath = path.join(__dirname, 'sqls', '20260328120000-add-comment-reactions-down.sql');
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, { encoding: 'utf-8' }, (err, data) => {
            if (err) return reject(err);
            resolve(data);
        });
    }).then(data => db.runSql(data));
};
export const _meta = { version: 1 };