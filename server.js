const config = require("config");
const cluster = require("cluster");
const numCPUs = require("os").cpus().length;
const restify = require("restify");

if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);

  // Fork workers.
  var i = 0;
  while (i < numCPUs) {
    cluster.fork();
    i++;
  }

  cluster.on("exit", (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} died`);
  });
} else {
  var server = restify.createServer();

  server.listen(config.get("port"), function() {
    console.log("%s listening at %s:%s", server.name, server.url);
  });
  console.log(`Worker ${process.pid} started`);
}
