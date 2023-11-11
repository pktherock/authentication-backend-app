import multer from "multer";

const storageConfig = multer.diskStorage({
  destination(req, file, cb) {
    // This storage needs public/images folder in the root directory
    // Else it will throw an error saying cannot find path public/images
    cb(null, "./public/images");
  },

  filename(req, file, cb) {
    let fileExtension = "";
    if (file.originalname.split(".").length > 1) {
      fileExtension = file.originalname.substring(
        file.originalname.lastIndexOf(".")
      );
    }
    const filenameWithoutExtension = file.originalname
      .toLowerCase()
      .split(" ")
      .join("-")
      ?.split(".")[0];

    cb(
      null,
      filenameWithoutExtension +
        Date.now() +
        Math.ceil(Math.random() * 1e5) + // avoid rare name conflict
        fileExtension
    );
  },
});

const fileUpload = multer({
  storage: storageConfig,
});

export default fileUpload;
