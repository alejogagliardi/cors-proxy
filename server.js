var express = require('express'),
    request = require('request'),
    bodyParser = require('body-parser'),
    path = require('path'),
    app = express();

var myLimit = typeof (process.argv[2]) != 'undefined' ? process.argv[2] : '100kb';
console.log('Using limit: ', myLimit);

app.use(express.static(__dirname + "/../client/dist"))

app.use(bodyParser.json({ limit: myLimit }));

app.get("/", function(req, res)  {
    res.sendFile(path.join(__dirname))
});

app.all('/proxy*', function (req, res, next) {

    // Set CORS headers: allow all origins, methods, and headers: you may want to lock this down in a production environment
    res.header("Access-Control-Allow-Origin", "http://visorlp.genmap.com.ar");
    res.header("Access-Control-Allow-Methods", "GET, PUT, PATCH, POST, DELETE");
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header("Access-Control-Allow-Headers", req.header('access-control-request-headers'));


    if (req.method === 'OPTIONS') {
        // CORS Preflight
        res.send();
    } else {
        var targetURL = req.header('Target-URL');
        if (!targetURL) {
            res.send(500, { error: 'There is no Target-Endpoint header in the request' });
            return;
        }
        var reqPath = req.url.replace('/proxy','')
        if (req.header('Authorization')) {

            request({ url: targetURL + reqPath, method: req.method, json: req.body, headers: { 'Authorization': req.header('Authorization') } },
                function (error, response, body) {
                    if (error) {
                        console.error('error: ' + response.statusCode)
                    }
                    console.log(targetURL + reqPath);
                }).pipe(res);
        } else {
            request({ url: targetURL + reqPath, method: req.method, json: req.body },
                function (error, response, body) {
                    if (error) {
                        console.error('error: ' + response.statusCode)
                    }
                    console.log(targetURL + reqPath);
                }).pipe(res);

        }
    }
});

app.set('port', process.env.PORT || 3000);

app.listen(app.get('port'), function () {
    console.log('Proxy server listening on port ' + app.get('port'));
});