import fs from "fs";
import Jimp from "jimp";
import ColorThief from "color-thief";
import tmp from "tmp-promise";
import sizeOf from "buffer-image-size";

const thief = new ColorThief();

export const getDominantColor = image => thief.getColor(image);

export const toBase64 = file =>
  Buffer.from(fs.readFileSync(file)).toString("base64");

export const fromBase64 = base64 => Buffer.from(base64, "base64");

export const replaceColor = (img, color, mimeType) => {
  return new Promise(async function replaceColorPromise(resolve, reject) {
    const dimensions = sizeOf(img);

    Jimp.read(img).then(firstImage => {
      const newImage = new Jimp(
        dimensions.width,
        dimensions.height,
        color,
        async (err, bgImage) => {
          if (err) reject(err);
          try {
            await bgImage.composite(firstImage, 0, 0);
            const buff = await bgImage.getBufferAsync(mimeType);
            resolve(fromBase64(buff));
          } catch (error) {
            reject(error);
          }
        }
      );
    });
  });
};

export const toArray = obj => {
  var arr = [];
  Object.keys(obj).forEach(key => {
    arr.push(obj[key]);
  });
  return arr;
};

export const createTmpDir = name => {
  return new Promise(async function createTmpDirPromise(resolve, reject) {
    try {
      const dir = await tmp.dir({ prefix: `Worker-${name}-` });

      resolve(dir.path);
    } catch (err) {
      // console.log(err);
      tmp.setGracefulCleanup();
      reject(err);
    }
  });
};

export const createTmpFile = (dir, name, content) => {
  return new Promise(async function createTmpFilePromise(resolve, reject) {
    try {
      const file = await tmp.file({ dir });

      fs.writeFile(file.path, content, err => reject(err));

      resolve(file.path);
    } catch (err) {
      // console.log(err);
      tmp.setGracefulCleanup();
      reject(err);
    }
  });
};
