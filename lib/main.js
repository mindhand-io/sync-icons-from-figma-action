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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
const core_1 = __importDefault(require("@actions/core"));
const io_1 = __importDefault(require("@actions/io"));
const exec_1 = require("@actions/exec");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const { getNode, getSvgs } = require("./figmaAPI");
const { download } = require("./utils");
const TEMP_SVG_PATH = path_1.default.resolve(process.env.GITHUB_WORKSPACE, "__SVG__TEMP__FOLDER__");
const SVG_PATH = path_1.default.resolve(process.env.GITHUB_WORKSPACE, core_1.default.getInput("svg_folder_path") || "svg");
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const figmaFileKey = core_1.default.getInput("figma_file_key");
            const frameWithIconsId = core_1.default.getInput("frame_with_icons_id");
            core_1.default.info(`Getting file ${figmaFileKey} with node ${frameWithIconsId}`);
            const svgUrls = yield getFigmaSvgUrls(figmaFileKey, frameWithIconsId);
            core_1.default.info(`Start downloading...`);
            yield downloadAllSvgs(svgUrls);
            yield setUpGit();
            if (!fs_1.default.existsSync(SVG_PATH)) {
                yield io_1.default.mkdirP(SVG_PATH);
            }
            const { added, deleted, modified } = utils_1.compareDir(SVG_PATH, TEMP_SVG_PATH);
            if (deleted.length) {
                core_1.default.warning(`[BREAKING CHANGE] ${deleted.join(", ")} deleted`);
                utils_1.deleteFiles(deleted.map((item) => (item.name1 || item.name2)), SVG_PATH);
                yield commit(`delete(icons)!: deleted ${deleted.join(", ")}

BREAKING CHANGE: ${deleted.join(", ")} was deleted!
      `);
            }
            if (added.length || modified.length) {
                yield io_1.default.mv(TEMP_SVG_PATH, SVG_PATH);
                yield io_1.default.rmRF(TEMP_SVG_PATH);
                if (added.length) {
                    core_1.default.info(`add ${added.join(", ")}`);
                    yield commit(`new(icons): add ${added.join(", ")}`, added.map((item) => path_1.default.resolve(SVG_PATH, (item.name1 || item.name2))));
                }
                if (modified.length) {
                    core_1.default.info(`update ${modified.join(", ")}`);
                    yield commit(`update(icons): update ${modified.join(", ")}`, modified.map((item) => path_1.default.resolve(SVG_PATH, (item.name1 || item.name2))));
                }
            }
            yield push();
        }
        catch (error) {
            core_1.default.setFailed(error.message);
        }
    });
}
const getFigmaSvgUrls = (fileKey, nodeId) => __awaiter(void 0, void 0, void 0, function* () {
    const nodes = yield getNode(fileKey, nodeId);
    const nodeIds = encodeURIComponent(nodes.map((item) => item.id).join(","));
    const imageUrlsWithId = yield getSvgs(fileKey, nodeIds);
    const results = [];
    Object.entries(imageUrlsWithId).map(([key, value]) => {
        const name = nodes.find((_) => _.id === key).name;
        results.push({
            name,
            url: value,
        });
    });
    return results;
});
const downloadAllSvgs = (svgUrls) => {
    const downloadAll = svgUrls.map((item) => download({
        name: `${item.name}.svg`,
        url: item.url,
        path: TEMP_SVG_PATH,
    }));
    return Promise.all(downloadAll);
};
const setUpGit = () => __awaiter(void 0, void 0, void 0, function* () {
    yield exec_1.exec(`git config --global user.name '${process.env.GITHUB_ACTOR}'`);
    yield exec_1.exec(`git config --global user.email '${process.env.GITHUB_ACTOR}@users.noreply.github.com`);
});
const commit = (message, files) => __awaiter(void 0, void 0, void 0, function* () {
    const addArg = (files === null || files === void 0 ? void 0 : files.length) ? files.join(" ") : "-A";
    yield exec_1.exec(`git add ${addArg}`);
    yield exec_1.exec(`git commit -m '${message}'`);
});
const push = () => exec_1.exec("git push -u origin HEAD");
run();
