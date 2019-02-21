import config from "config";
import { removeBackgroundFromImageBase64 } from "remove.bg";
import invert from "invert-color";
import mime from "mime";
import path from "path";
import tmp from "tmp-promise";
import {
  toArray,
  toBase64,
  fromBase64,
  replaceColor,
  getDominantColor
} from "api/helpers/";

const APIKey = config.get("apiKey");

const promisify = (func, req, res, next) => {
  try {
    let files = toArray(req.files);
    let promises = [];

    files.map(file => {
      promises.push(func(file));
    });

    Promise.all(promises)
      .then(images => {
        res.send({
          images
        });
        next();
      })
      .catch(error => {
        tmp.setGracefulCleanup();
        res.send({
          error
        });
        next();
      });
  } catch (error) {
    tmp.setGracefulCleanup();
    res.send({
      error
    });
    next();
  }
};

var process = file => {
  return new Promise(async function processPromise(resolve, reject) {
    const returnImg = await fetchFile(file);
    const base64Img = fromBase64(returnImg);
    const dominantColor = getDominantColor(base64Img);

    resolve({
      image: returnImg,
      dominant: invert(dominantColor)
    });
  });
};

var replace = file => {
  return new Promise(async function replacePromise(resolve, reject) {
    try {
      const image = await replaceWith(file);

      resolve({
        image
      });
    } catch (error) {
      reject(error);
    }
  });
};

var replaceWith = (file, color) => {
  return new Promise(async function replaceWithPromise(resolve, reject) {
    try {
      const returnImg = await fetchFile(file);
      const base64Img = fromBase64(returnImg);
      const colour = color ? color : invert(getDominantColor(base64Img));
      const mimeType = mime.getType(path.extname(file.name));
      const image = await performColorReplace(base64Img, colour, mimeType);

      resolve(image);
    } catch (error) {
      reject(error);
    }
  });
};

var performColorReplace = (file, color, mimeType) => {
  return new Promise(async function performColorReplacePromise(
    resolve,
    reject
  ) {
    try {
      const image = await replaceColor(file, color, mimeType);

      resolve(image);
    } catch (error) {
      reject(error);
    }
  });
};

var fetchFile = function(file) {
  const base64 = toBase64(file.path);

  return new Promise(function fetchFilePromise(resolve, reject) {
    removeBackgroundFromImageBase64({
      base64img: base64,
      apiKey: APIKey,
      size: "regular"
    })
      .then(result => resolve(result.base64img))
      .catch(errors => reject(errors));
  });
};

module.exports = {
  process: promisify.bind(promisify, process),
  replace: promisify.bind(promisify, replace),
  replaceWith
};
