/**
 * Encryption-related libraries
 * @author  MarcoXZh3
 * @version 1.1.1
 */
var name = module.exports.name = 'encryption';
module.exports.version = '1.1.1';


var crypto = require('crypto')
var algorithm = 'aes-256-cbc';
var fs = require('fs');
var _debug;
var _sync;

/**
 * Supportive settings: key length and salty symbols
 */
var KEY_LENGTH = 4096;
var DUMMY = '`~!$%^&*-+=|\\;?/<>';

/**
 * the encryption function, syncronized version
 * @param {string|array}    plain_data  the plain data to be ecnrypted
 * @param {string}          password    the password for encryption
 */
var encryptDataSync = module.exports.encryptDataSync =
function(plain_data, password) {
    if (!plain_data) {
        throw new TypeError(name
                            + '.encryptDataSync<plain_data>: expect=string|array'
                            + '; get=' + typeof plain_data);
    } else if (typeof plain_data !== 'string') {
        plain_data = plain_data.toString();
    } else if (plain_data.length === 0) {
        throw new RangeError(name + '.encryptDataSync<plain_data>: length='
                                  + plain_data.length);
    } // if - else if ...
    if (!password || typeof password !== 'string') {
        throw new TypeError(name
                            + '.encryptDataSync<password>: expect=string; get='
                            + typeof plain_data);
    } else if (password.length === 0) {
        throw new RangeError(name + '.encryptDataSync<password>: length='
                                  + password.length);
    } // if - else if ...

    // Salt the data with dummies
    var encrypted_data = plain_data.toString();
    while (encrypted_data.length < KEY_LENGTH) {
        var idx1 = Math.floor(encrypted_data.length * Math.random());
        var idx2 = Math.floor(DUMMY.length * Math.random());
        encrypted_data = encrypted_data.substring(0, idx1) + DUMMY[idx2]
                         + encrypted_data.substring(idx1, encrypted_data.length);
    } // while (encrypted_data.length < KEY_LENGTH)

    // Encrypt
    var cipher = crypto.createCipher(algorithm, password);
    encrypted_data = cipher.update(encrypted_data, 'utf8', 'binary');
    encrypted_data += cipher.final('binary');
    return encrypted_data;
} // function encryptDataSync(plain_data, password)

/**
 * the encryption function, asyncronized version
 * @param {string|array}    plain_data  the plain data to be ecnrypted
 * @param {string}          password    the password for encryption
 * @param {function}        callback    the call back function
 *      @param {array}      encrypted_data   the encrypted data
 */
var encryptData = module.exports.encryptData =
function(plain_data, password, callback) {
    if (callback) {
        callback(encryptDataSync(plain_data, password));
    } else {
        throw new TypeError(name + '.encryptData: missing callback function');
    } // else - if (callback)
}; // function encryptData(plain_data, password, callback)

/**
 * the decryption function, syncronized version
 * @param {array}   encrypted_data  the encrypted data to be decrypted
 * @param {string}  password        the password for decryption
 */

var decryptDataSync = module.exports.decryptDataSync =
function(encrypted_data, password) {
    if (!encrypted_data || ! encrypted_data instanceof Array) {
        throw new TypeError(name
                            + '.decryptDataSync<encrypted_data>: expect=array' +
                            '; get=' + typeof encrypted_data);
    } else if (encrypted_data.length === 0) {
        throw new RangeError(name + '.decryptDataSync<encrypted_data>: length='
                                  + encrypted_data.length);
    } // if - else if ...
    if (!password || typeof password !== 'string') {
        throw new TypeError(name
                            + 'decryptDataSync<password>: expect=string; get=' +
                            + typeof plain_data);
    } else if (password.length === 0) {
        throw new RangeError(name + 'decryptDataSync<password>: length='
                                  + password.length);
    } // if - else if ...

    // Decrypt
    var decipher = crypto.createDecipher(algorithm, password);
    var decrypted_data = decipher.update(encrypted_data, 'binary', 'utf8');
    decrypted_data += decipher.final('utf8');

    // Un-salt the decrypted data
    DUMMY.split('').forEach(function(dummy) {
        decrypted_data = decrypted_data.split(dummy).join('');
    }); // DUMMY.split('').forEach(function(dummy) { ... });

    return decrypted_data;
} // function decryptDataSync(encrypted_data, password)

/**
 * the decryption function, asyncronized version
 * @param {array}       encrypted_data  the encrypted data to be decrypted
 * @param {string}      password        the password for decryption
 * @param {function}    callback        the call back function
 *      @param {array}      decrypted_data  the decrypted data
 */
var decryptData = module.exports.decryptData =
function(encrypted_data, password, callback) {
    if (callback) {
        callback(decryptDataSync(encrypted_data, password));
    } else {
        throw new TypeError(name + '.decryptData: missing callback function');
    } // else - if (callback)
} // function decryptData(encrypted_data, password, callback)

/**
 * import encrypted data from file and decrypt, syncronized version
 * @param {string}      filename    the file that stores the encrypted data
 * @param {string}      password    the password for decryption
 */
var importFileSync = module.exports.importFileSync =
function(filename, password) {
    try {
        var data = fs.readFileSync(filename, { 'flag':'r' });
        return decryptDataSync(data.toString(), password);
    } catch (err) {
        err.message = name + '.' + err.message;
        throw err;
    } // try - catch (err)
} // function importFileSync(filename, password)

/**
 * import encrypted data from file and decrypt, asyncronized version
 * @param {string}      filename    the file that stores the encrypted data
 * @param {string}      password    the password for decryption
 * @param {function}    callback    the call back function
 *      @param {array}      encrypted_data   the encrypted data
 */
var importFile = module.exports.importFile =
function(filename, password, callback) {
    if (callback) {
        fs.readFile(filename, {'flag': 'r'}, function(err, data) {
            if (err) {
                err.message = name + '.' + err.message;
                throw err;
            } // if (err)
            decryptData(data.toString(), password,
            function(decrypted_data) {
                callback(decrypted_data);
            }); // decryptData( ... );
        }); // fs.readFile(filename, {'flag': 'r'}), (err, data) )
    } else {
        throw new TypeError(name + '.importFile: missing callback function');
    } // else - if (!callback)
} // function importFile(filename, password, callback)

/**
 * export plain data with encryption, syncronized version
 * @param {string}      filename    the file that stores the encrypted data
 * @param {string}      password    the password for decryption
 */
var exportFileSync = module.exports.exportFileSync =
function(plain_data, filename, password) {
    var encrypted_data = encryptDataSync(plain_data, password);
    try {
        fs.writeFileSync(filename, encrypted_data, {'flag': 'w'});
    } catch (err) {
        err.message = name + '.' + err.message;
        throw err;
    } // try - catch (err)
} // function exportFileSync(plain_data, filename, password)

/**
 * export plain data with encryption, asyncronized version
 * @param {string}      filename    the file that stores the encrypted data
 * @param {string}      password    the password for decryption
 * @param {function}    callback    the call back function
 */
var exportFile = module.exports.exportFile =
function(plain_data, filename, password, callback) {
    if (callback) {
        encryptData(plain_data, password,
        function(encrypted_data) {
            fs.writeFile(filename, encrypted_data, { 'flag':'w' },
            function(err) {
                if (err) {
                    err.message = name + '.' + err.message;
                    throw err;
                } // if (err)
                callback();
            }); // fs.writeFileSync( ... );
        }); // encryptData( ... );
    } else {
        throw new TypeError(name + '.exportFile: missing callback function');
    } // else - if (callback)
} // function exportFile(plain_data, filename, password, callback)


if (_debug) {
    var enc = new Encryptions(false);
    if (_sync) {
        var password = fs.readFileSync('pw.log', { 'flag':'r' });
        console.log('Password="' + password + '"');
        var keys = fs.readFileSync('keys.json', { 'flag':'r' }).toString();
        console.log(keys);
        enc.exportFileSync(keys, 'keys', password);
        var dec = enc.importFileSync('keys', password);
        console.log('dec="' + dec + '"');
        var obj = JSON.parse(dec);
        for (var k in keys) {
            if (keys.hasOwnProperty(k))
                assert(keys[k] == dec[k], 'Encryption: error-mismatch');
            else
                console.log('Encryption: missing key');
        } // for (var k in keys)
    } else {
        fs.readFile('pw.log', { 'flag':'r' }, function(err, data) {
            if (err)        throw err;
            var password = data.toString();
            console.log('Password="' + password + '"');
            fs.readFile('keys.json', { 'flag':'r' }, function(err, data) {
                if (err)        throw err;
                var keys = data.toString();
                console.log(keys);
                enc.exportFile(keys, 'keys', password, function() {
                    enc.importFile('keys', password, function(decrypted_data) {
                        var dec = decrypted_data.toString();
                        console.log(decrypted_data);
                        var obj = JSON.parse(decrypted_data);
                        for (var k in keys) {
                            if (keys.hasOwnProperty(k))
                                assert(keys[k] == dec[k], 'Encryption: error-mismatch');
                            else
                                console.log('Encryption: missing key');
                        } // for (var k in keys)
                    }); // enc.importFile('keys', password, function(decrypted_data) { ... } );
                }); // enc.export_ecrypted(keys, password, function() { ... } );
            }); // fs.readFile('keys0.json', {'flag': 'r'}, function(err, data) { ... } );
        }); // fs.readFile('pw.log', {'flag': 'r'}, function(err, data) { ... } );
    } // if (_sync)
} // if (_debug)
