import { compareDir, deleteFiles } from "./utils";

import * as core from "@actions/core";
import * as io from "@actions/io";
import { exec } from "@actions/exec";

import * as fs from "fs";
import * as path from "path";

const { getNode, getSvgs } = require("./figmaAPI");
const { download } = require("./utils");

const TEMP_SVG_PATH = path.resolve(
  process.env.GITHUB_WORKSPACE!,
  "__SVG__TEMP__FOLDER__"
);

const SVG_PATH = path.resolve(
  process.env.GITHUB_WORKSPACE!,
  core.getInput("svg_folder_path") || "svg"
);

async function run() {
  try {
    const figmaFileKey = core.getInput("figma_file_key");
    const frameWithIconsId = core.getInput("frame_with_icons_id");

    core.info(`Getting file ${figmaFileKey} with node ${frameWithIconsId}`);
    const svgUrls = await getFigmaSvgUrls(figmaFileKey, frameWithIconsId);

    core.info(`Start downloading...`);
    await io.mkdirP(TEMP_SVG_PATH);
    await downloadAllSvgs(svgUrls);

    await setUpGit();

    if (!fs.existsSync(SVG_PATH)) {
      await io.mkdirP(SVG_PATH);
    }

    const { added, deleted, modified } = compareDir(SVG_PATH, TEMP_SVG_PATH);
    if (deleted.length) {
      core.warning(`[BREAKING CHANGE] ${deleted.join(", ")} deleted`);
      deleteFiles(deleted, SVG_PATH);
      await commit(`delete(icons)!: deleted ${deleted.join(", ")}

BREAKING CHANGE: ${deleted.join(", ")} was deleted!`);
    }

    if (added.length || modified.length) {
      await io.mv(TEMP_SVG_PATH, SVG_PATH);
      await io.rmRF(TEMP_SVG_PATH);
      if (added.length) {
        core.info(`add ${added.join(", ")}`);
        await commit(
          `new(icons): add ${added.join(", ")}`,
          added.map((item) => path.resolve(SVG_PATH, item))
        );
      }
      if (modified.length) {
        core.info(`update ${modified.join(", ")}`);
        await commit(
          `update(icons): update ${modified.join(", ")}`,
          modified.map((item) => path.resolve(SVG_PATH, item))
        );
      }
    }
    await push();
  } catch (error) {
    core.setFailed(error.message);
  }
}

const getFigmaSvgUrls = async (fileKey, nodeId) => {
  const nodes = await getNode(fileKey, nodeId);
  const nodeIds = encodeURIComponent(nodes.map((item) => item.id).join(","));
  const imageUrlsWithId = await getSvgs(fileKey, nodeIds);
  const results: { name: string; url: unknown }[] = [];
  Object.entries(imageUrlsWithId).map(([key, value]) => {
    const name = nodes.find((_) => _.id === key).name;
    results.push({
      name,
      url: value,
    });
  });
  return results;
};

const downloadAllSvgs = (svgUrls) => {
  const downloadAll = svgUrls.map((item) =>
    download({
      name: `${item.name}.svg`,
      url: item.url,
      path: TEMP_SVG_PATH,
    })
  );
  return Promise.all(downloadAll);
};

const setUpGit = async () => {
  await exec(`git config --global user.name '${process.env.GITHUB_ACTOR}'`);
  await exec(
    `git config --global user.email '${process.env.GITHUB_ACTOR}@users.noreply.github.com`
  );
};

const commit = async (message: string, files?: string[]) => {
  const addArg = files?.length ? files.join(" ") : "-A";
  await exec(`git add ${addArg}`);
  await exec(`git commit -m "${message}"`);
};

const push = () => exec("git push -u origin HEAD");

run();
