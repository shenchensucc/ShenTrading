/**
 * shentrading trading bot 
 */
const cheerio = require('cheerio')
const fs = require('fs');
const https = require('https');
const sqlite3 = require('sqlite3').verbose();
const steem = require('steem');


/**
 * Find out the length of a string considering foreign characters
 * @param {string}      str         the source string
 * @returns {integer}               length of the string
 */
var findStringLength = function(str) {
    var length = 0;
    for (var i = 0; i < str.length; i++) {
        length += encodeURI(str.charAt(i)).length > 2 ? 2 : 1
    } // for (var i = 0; i < str.length; i++)
    return length;
}; // var findStringLength = function(str) { ... };


/**
 * The main process
 * @param {json}        parentOptions   the options from caller
 * @param {function}    callback        the callback function
 */
module.exports = function(parentOptions, callback) {
    fs.readFile(__filename.replace(/\.js$/g, '.json'),
                { encoding:'utf8', flag:'r'}, function(err, data) {
        if (err) {
            throw err;
        } // if (err)
        var options = JSON.parse(data.toString());
        for (k in parentOptions) {
            options[k] = parentOptions[k];
        } // for (k in parentOptions)
        options.db = new sqlite3.Database(options.sqlite3, function(err) {
            if (err) {
                throw err;
            } // if (err)
            options.db.run(
                `CREATE TABLE IF NOT EXISTS BloggerCCTrading (
                    created     INTEGER,
                    author      TEXT,
                    title       TEXT,
                    permlink    TEXT,
                    tags        TEXT,
                    body        TEXT
                );`
            ); // options.db.run( ... );

            // Run the job
            runJob(options, callback);
        }); // options.db = new sqlite3.Database(options.sqlite3, function(err) );
    }); // fs.readFile( ... );
}; // module.exports = function(parentOptions, callback) { ... };


/**
 * Run the job of the blogger
 * @param {json}        options     settings for the job
 * @param {function}    callback    (optional) the callback function
 */
var runJob = function(options, callback) {
    https.get(options.url, function(res) {
        res.on('error', function(err) {
            throw err;
        }); // res.on('error', function(err) { ... });
        var html = '';
        res.on('data', function(data) {
            html += data;
        }); // res.on('data', function(data) { ... });
        res.on('end', function() {
            const $ = cheerio.load(html);
            console.log(new Date().toISOString(), 'BloggerCCTrading', 'DOM retrieved');

            // Grab target information from DOM
            retrieve(options, $, callback);
        }); // res.on('end', function() { ... });
    }); // https.get(options.url, function(res) { ... });
}; // var runJob = function(options, callback) { ... };


/**
 * Retrieve target information from the DOM
 * @param {json}        options     settings for the job
 * @param {object}      $           the DOM tree
 * @param {function}    callback    (optional) the callback function
 */
var retrieve = function(options, $, callback) {
    var names = [];
    $('.currency-name-container').each( (i,e)=>{ names.push(e.children[0].data) } );
    var prices    = $('.price')                  .map( (i,e)=>e.children[0].data );

    fs.readFile(__filename.replace(/\.js$/g, '.csv'),
                { encoding:'utf8', flag:'r'}, function(err, txt) {
        if (err) {
            throw err;
        } // if (err)

        var record = new Date();
        var start = new Date(options.start + 'T' + record.toISOString().split('T')[1]);
        var days = Math.round((record.getTime() - start.getTime()) / 86400000);
        var totalIn = 0;
        var totalValue = 0.0;
        var data = {
            start: {
                en: start.toISOString().split('T')[0],
                zh: start.getUTCFullYear() + '年' +
                    (start.getUTCMonth()+1) + '月' +
                    start.getUTCDate() + '日'
            },
            record: {
                en: record.toISOString().split('T')[0],
                zh: record.getUTCFullYear() + '年' +
                    (record.getUTCMonth()+1) + '月' +
                    record.getUTCDate() + '日'
            },
            total: { en:days, zh:days },
            portfolio:
                txt.split('\n').map(function(e, i) {
                    var cols = e.trim().split(',');
                    var idx = cols.findIndex( (c)=>c.trim()==='Total in');
                    if (idx >= 0) {
                        totalIn = parseInt(cols[idx+1]);
                    } // if (cols.findIndex( (c)=>c==='Total in'))
                    if (i === 0 || e.trim().length === 0 || e.startsWith('Total')) {
                        return null;
                    } // if (i === 0 || e.trim().length === 0 || e.startsWith(','))
                    e = e.trim().split(',');
                    var idx = names.findIndex( (n)=>n===e[0] );
                    if (idx >= 0) {
                        // e.push(prices[idx]);
                        var value =  parseFloat(prices[idx].substr(1)) * 
                                     parseFloat(e[1]);
                        totalValue += value;
                        e.push(value);
                    } // if (idx >= 0)
                    return e;
                }).filter( (e)=>e ),
            totalValue: totalValue,
            totalIn: totalIn,
            earn: {
                en: Math.round(10000*(totalValue/totalIn-1.0)) / 100 + '%',
                zh: Math.round(10000*(totalValue/totalIn-1.0)) / 100 + '%'
            }
        }; // var data = { ... };
        data.portfolio = data.portfolio.map(function(e) {
            var value = e[e.length-1] / totalValue;
            value = Math.round(value * 10000) / 100.0 + '%';
            return '| ' + e[0] + ' | ' + value + ' |';
        }).join('\n'); // data.portfolio = data.portfolio.map(function(e) { ... }).join('\n');
        console.log(new Date().toISOString(), 'BloggerCCTrading', 'data analyzed');

        // Prepare the blog text using the data
        prepareBlog(options, data, callback);
    }); // fs.readFile(__filename.replace(/\.js$/g, '.csv'), ... });
}; // var retrieve = function(options, $, callback) { ... };


/**
 * Prepare the blog text
 * @param {json}        options     settings for the job
 * @param {json}        data        the data for the blog
 * @param {function}    callback    (optional) the callback function
 */
var prepareBlog = function(options, data, callback) {
    fs.readFile(__filename.replace(/\.js$/g, '.md'),
                { encoding:'utf8', flag:'r'}, function(err, txt) {
        if (err) {
            throw err;
        } // if (err)

        // Prepare blog
        var blog = {
            author:         options.author.name,
            title:          options.title + new Date().toISOString().split('T')[0],
            json_metadata:  options.json_metadata,
            body:           txt.toString()
                               .replace('$IMAGE', options.image)
                               .replace('$PHOTO.from', options.photo.from)
                               .replace('$PHOTO.url', options.photo.url)
                               .replace('$START.en', data.start.en)
                               .replace('$START.zh', data.start.zh)
                               .replace('$RECORD.en', data.record.en)
                               .replace('$RECORD.zh', data.record.zh)
                               .replace('$TOTAL.en', data.total.en)
                               .replace('$TOTAL.zh', data.total.zh)
                               .replace('$EARN.en', data.earn.en)
                               .replace('$EARN.zh', data.earn.zh)
                               .replace('$PORTFOLIO', data.portfolio)
        }; // var blog = { ... };
        console.log(new Date().toISOString(), 'BloggerCCTrading', 'blog ready');

        // Vote and save the blog
        publishAndSave(options, blog, callback);
    }); // fs.readFile( ... );
}; // var prepareBlog = function(options, data, callback) { ... };


/**
 * 
 * @param {json}        options     settings for the job
 * @param {json}        blog        the blog to be published
 * @param {function}    callback    (optional) the callback function
 */
var publishAndSave = function(options, blog, callback) {
    // Publish
    var permlink = options.author.name +
                   '-cn-my-cryptocurrency-trading-record-' +
                   new Date().toISOString().split('T')[0];

    steem.broadcast.comment(options.author.posting_key, '', 'cn', blog.author,
                            permlink, blog.title, blog.body, blog.json_metadata,
                            function(err, re) {
        if (err) {
            throw err;
        } // if (err)
        console.log(new Date().toISOString(), 'BloggerCCTrading', 'blog published');

        // Published, now save it to database
        options.db.all(`SELECT permlink FROM BloggerCCTrading WHERE permlink=?`,
                       [permlink],
                       function(err, rows) {
            if (err) {
              throw err;
            } // if (err)

            // Determine whether insert new or update old
            var sql = (rows.length === 0) ?
                `INSERT INTO BloggerCCTrading(created, author, title, permlink,
                                              tags, body)
                             VALUES(?, ?, ?, ?, ?, ?)` :
                `UPDATE BloggerCCTrading SET created=?, author=?, title=?,
                                             permlink=?, tags=?, body=?
                                         WHERE permlink=?`
            var values = [
                new Date().getTime(),
                blog.author,
                blog.title,
                permlink,
                JSON.stringify(blog.json_metadata.tags),
                blog.body
            ]; // values = [ ... ];
            if (rows.length > 0) {
                values.push(permlink);
                console.warn(new Date().toISOString(), 'BloggerCCTrading',
                            'blog already published; now updated');
            } // if (rows.length > 0)

            // Run the SQL
            options.db.run(sql, values, function(err) {
                if (err) {
                    throw err;
                } // if (err)
                options.db.close();
                console.log(new Date().toISOString(), 'BloggerCCTrading', 'blog saved');

                // All done, return
                if (callback) {
                    callback(blog);
                } // if (callback)

            }); // options.db.run(sql, values, function(err) { ... });
        }); // options.db.all( ... });
    }); // steem.broadcast.comment( ... );
}; // var publishAndSave = function(options, blog, callback) { ... };
