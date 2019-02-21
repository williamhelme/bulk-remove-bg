import config from "config";
import fs from "fs";
import restify from "restify";
import mime from "mime";
import path from "path";
import removeAPI from "api/remove.bg/";
import { toArray } from "api/helpers/";
import tmp from "tmp-promise";
import { createTmpDir, createTmpFile } from "../helpers";

const create = function createServer() {
  const server = restify.createServer();

  server.use(restify.plugins.acceptParser(server.acceptable));
  server.use(
    restify.plugins.queryParser({
      mapParams: true,
      mapFiles: true
    })
  );
  server.use(
    restify.plugins.bodyParser({
      mapParams: true,
      mapFiles: true,
      limit: "1gb",
      json: {
        limit: "1gb"
      },
      urlencoded: { limit: "1gb", extended: true, parameterLimit: 50000 }
    })
  );

  server.listen(config.get("port"), function() {
    console.log(
      "Worker %s: %s listening at %s",
      process.pid,
      server.name,
      server.url
    );
  });

  (async () => {
    server.tmpDir = await createTmpDir(process.pid);
  })();

  server.post("/remove.bg", removeAPI.process);
  server.post("/remove.bg/replace", async (req, res, next) => {
    let files = toArray(req.files);
    let file = files[0];

    try {
      const image = await removeAPI.replaceWith(file);
      const filepath = await createTmpFile(server.tmpDir, process.pid, image);
      console.log(filepath);
      fs.readFile(filepath, function(err, data) {
        if (err) throw err;

        res.contentType = mime.getType(path.extname(file.name));
        res.header("Content-disposition", "inline; filename=" + file.name);
        res.writeHead(200);
        res.end(data);
        return next();
      });
    } catch (error) {
      console.log(error);
      tmp.setGracefulCleanup();
      res.writeHead(500);
      res.end("");
      next(error);
    }
  });

  console.log(`Worker ${process.pid} started`);
};

export default {
  create
};
