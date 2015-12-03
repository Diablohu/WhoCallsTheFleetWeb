module.exports = function(app) {
    var client;
    if(app.get('ace')) {
        client = new ACESDK.CACHE(process.env.FLEET_CACHE_NAME);
        app.cache = {
            client: client,
            get: function(key, callback) {
                client.get(key, function(err, data) {
                    if(!callback)
                        return;
                    if(err)
                        callback(err);
                    else
                        callback(null, data.val.toString());
                });
            },
            set: function(key, value, time, callback) {
                client.set(key, value, time, function(err) {
                    if(!callback)
                        return;
                    callback(err);
                });
            }
        };
    } else {
        client = require('memory-cache');
        app.cache = {
            client: client,
            get: function(key, callback) {
                if(callback)
                    callback(client.get(key));
            },
            set: function(key, value, time, callback) {
                var result = client.put(key, value, time * 1000);
                if(callback)
                    callback(result);
            }
        };
    }
};
