import fs from "node:fs";

const getStaticFilePath = (req, fileName) => {
  return `${req.protocol}://${req.get("host")}/images/${fileName}`;
};

const getLocalPath = (fileName) => {
  return `public/images/${fileName}`;
};

const removeLocalFile = (localPath) => {
  fs.unlink(localPath, (err) => {
    if (err) console.log("Error while removing local files: ", err);
    else {
      console.log("Removed local: ", localPath);
    }
  });
};

export { removeLocalFile, getLocalPath, getStaticFilePath };
