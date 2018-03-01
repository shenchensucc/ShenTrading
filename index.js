/**
 * Main entry of the steemit blog autobot
 * @author  MarcoXZh3
 * @version 0.0.5
 */
module.exports.name = 'SteemitBlogger';

const CronJob = require('cron').CronJob;
const encryption = require('./libencryption');
const fs = require('fs');
const steem = require('steem');

var BloggerPromisingCC = require('./jobs/BloggerPromisingCC');
var BloggerCCTrading = require('./jobs/BloggerCCTrading');


var options = JSON.parse(fs.readFileSync('options.json', 'utf8').toString());
var password = fs.readFileSync('pw.log', 'utf8').toString().trim();
options.author = JSON.parse(encryption.importFileSync('key', password));

// Config steem to avoid unhandled error WebSocket not open
steem.api.setOptions({ url:'https://api.steemit.com' });
console.log(new Date().toISOString(), 'Steemit Blogger started');

// The BloggerPromisingCC schedule -- run everyday at 00:05:30 AM (UTC)
var cronBloggerPromisingCC = '30 00 00 * * *';
// The BloggerCCTrading schedule -- run everyday at 00:10:30 AM (UTC)
var cronBloggerCCTrading = '30 07 00 * * *';

// Start right away
setTimeout(function() {
    BloggerPromisingCC(options, function(blog) {
        console.log(new Date().toISOString(), 'BloggerPromisingCC', 'process executed');
    }); // BloggerPromisingCC(options, function(blog) { ... });
}, 1000);
setTimeout(function() {
    BloggerCCTrading(options, function(blog) {
        console.log(new Date().toISOString(), 'BloggerCCTrading', 'process executed');
    }); // BloggerCCTrading(options, function(blog) { ... });
}, 401000);


// The BloggerPromisingCC job
console.log(new Date().toISOString(),
            'BloggerPromisingCC', 'process scheduled:', cronBloggerPromisingCC);
new CronJob(cronBloggerPromisingCC, function() {
        console.log(new Date().toISOString(), 'BloggerPromisingCC', 'process started');
        BloggerPromisingCC(options, function(blog) {
        console.log(new Date().toISOString(), 'BloggerPromisingCC', 'process executed');
    }); // BloggerPromisingCC(options, function(blog) { ... });
}, null, true, 'UTC'); // new CronJob( ... );

// The BloggerCCTrading job
console.log(new Date().toISOString(),
            'BloggerCCTrading', 'process scheduled:', cronBloggerCCTrading);
new CronJob(cronBloggerCCTrading, function() {
        console.log(new Date().toISOString(), 'BloggerCCTrading', 'process started');
        BloggerCCTrading(options, function(blog) {
        console.log(new Date().toISOString(), 'BloggerCCTrading', 'process executed');
    }); // BloggerCCTrading(options, function(blog) { ... });
}, null, true, 'UTC'); // new CronJob( ... );
