const http = require('http');
const port = process.env.PORT || 3000;

http.createServer((req, res) => {
  res.end('Hello from Dokku v2');
}).listen(port, () => console.log('Running on port ' + port));

