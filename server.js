import cluster from "cluster";
import OS from "os";
import server from "api/server/";

cluster.on("exit", (worker, code, signal) => {
  console.log(`worker ${worker.process.pid} died`);
  cluster.fork();
});

if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);

  const numCPUs = OS.cpus().length;

  // Fork workers.
  var i = 0;
  while (i < numCPUs) {
    cluster.fork();
    i++;
  }
} else if (cluster.isWorker) {
  server.create();
} else {
  console.log("Cluster is neither master or worker", cluster);
}
