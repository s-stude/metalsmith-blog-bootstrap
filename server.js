var express = require('express');
var app = express();

app.use(express.static('build'));

var server = app.listen(process.env.PORT || 4000, function() {
    console.log('Listening on port %d', server.address().port);
});