"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const core = require("@actions/core");
const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");
const { getNode, getSvgs } = require("./figmaAPI");
const { download } = require("./utils");
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const figmaFileKey = core.getInput("figma_file_key");
            const frameWithIconsId = core.getInput("frame_with_icons_id");
            core.info(`Getting file ${figmaFileKey} with node ${frameWithIconsId}`);
            const svgUrls = yield getFigmaSvgUrls(figmaFileKey, frameWithIconsId);
            core.info(`Start downloading...`);
            yield downloadAllSvgs(svgUrls);
            core.info(`Start committing...`);
            yield commit();
        }
        catch (error) {
            core.setFailed(error.message);
        }
    });
}
const getFigmaSvgUrls = (fileKey, nodeId) => __awaiter(void 0, void 0, void 0, function* () {
    const nodes = yield getNode(fileKey, nodeId);
    const nodeIds = encodeURIComponent(nodes.map(item => item.id).join(","));
    const imageUrlsWithId = yield getSvgs(fileKey, nodeIds);
    const results = [];
    Object.entries(imageUrlsWithId).map(([key, value]) => {
        const name = nodes.find(_ => _.id === key).name;
        results.push({
            name,
            url: value
        });
    });
    return results;
});
const downloadAllSvgs = svgUrls => {
    const svgPath = path.resolve(process.env.GITHUB_WORKSPACE, core.getInput("svg_folder_path") || "svg");
    // delete prev files
    const files = fs.readdirSync(svgPath);
    files.forEach(item => fs.unlinkSync(path.join(svgPath, item)));
    const downloadAll = svgUrls.map(item => download({
        name: `${item.name}.svg`,
        url: item.url,
        path: svgPath
    }));
    return Promise.all(downloadAll);
};
const commit = () => new Promise((resolve, reject) => {
    // TODO: better commit message
    exec(`git config --global user.name '${process.env.GITHUB_ACTOR}' \\
      && git config --global user.email '${process.env.GITHUB_ACTOR}@users.noreply.github.com' \\
      && git add -A && git commit -m 'feat: modify icons' \\
      && git push -u origin HEAD`, error => {
        if (error) {
            reject(error);
        }
        else {
            resolve();
        }
    });
});
run();
