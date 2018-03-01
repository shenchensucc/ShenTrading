/**
 * the process to encrypt Steemit author information
 * @author:  MarcoXZh3
 * @version: 1.0.0
 */
const assert = require('assert');
const encryption = require('./libencryption');
const fs = require('fs');


try {
    var key = JSON.parse(fs.readFileSync('key.log', 'utf8').toString());
    var password = fs.readFileSync('pw.log', 'utf8').toString().trim();
    var encrypted = encryption.exportFileSync(JSON.stringify(key, null, 4),
                                              'key', password);
    var decrypted = JSON.parse(encryption.importFileSync('key', password));
    console.log('Raw key provided: ' + JSON.stringify(key));
    console.log('From ecnryptions: ' + JSON.stringify(decrypted));
    assert.deepEqual(key, decrypted, 'Key error when ecrypting/decrypting');
    console.log('key generated successfully');
} catch (err) {
    // throw err;
    console.log('\x1b[31m', err.message);
    console.log('\x1b[0m', '');
} // try - catch (err)
