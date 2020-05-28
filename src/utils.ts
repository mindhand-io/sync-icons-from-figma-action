import * as fs from "fs";
import * as path from "path";
import axios from "axios";
import { compareSync, Options } from "dir-compare";

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
    responseType: "stream",
  });

  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on("finish", resolve);
    writer.on("error", reject);
  });
}

const compareOptions: Options = {
  compareContent: true,
};

export function compareDir(oldPath: string, newPath: string) {
  const added: string[] = [];
  const deleted: string[] = [];
  const modified: string[] = [];
  const result = compareSync(oldPath, newPath, compareOptions);
  if (!result.same) {
    result.diffSet
      ?.filter((item) => (item.name1 || item.name2)?.split(".").pop() === "svg")
      .forEach((diff) => {
        const filename: string = (diff.name1 || diff.name2)!;
        switch (diff.state) {
          case "distinct":
            modified.push(filename);
            break;
          case "left":
            deleted.push(filename);
            break;
          case "right":
            added.push(filename);
            break;
        }
      });
  }
  return {
    added,
    deleted,
    modified,
  };
}

export function deleteFiles(files: string[], folderPath: string) {
  files.forEach((item) => fs.unlinkSync(path.join(folderPath, item)));
}
