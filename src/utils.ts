const fs = require("fs");
const path = require("path");
const axios = require("axios");

interface DownloadFileParams {
  name: string;
  url: string;
  path: string;
}

export async function download(params: DownloadFileParams) {
  const { path: savePath, url, name } = params;
  const writer = fs.createWriteStream(path.resolve(savePath, name));

  const response = await axios({
    url,
    method: "GET",
    responseType: "stream"
  });

  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on("finish", resolve);
    writer.on("error", reject);
  });
}
