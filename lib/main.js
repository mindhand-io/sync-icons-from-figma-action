"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
const core = __importStar(require("@actions/core"));
const io = __importStar(require("@actions/io"));
const exec_1 = require("@actions/exec");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const { getNode, getSvgs } = require("./figmaAPI");
const { download } = require("./utils");
const TEMP_SVG_PATH = path.resolve(process.env.GITHUB_WORKSPACE, "__SVG__TEMP__FOLDER__");
const SVG_FOLDER = core.getInput("svg_folder_path") || "svg";
const SVG_PATH = path.resolve(process.env.GITHUB_WORKSPACE, SVG_FOLDER);
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const figmaFileKey = core.getInput("figma_file_key");
            const frameWithIconsId = core.getInput("frame_with_icons_id");
            core.info(`Getting file ${figmaFileKey} with node ${frameWithIconsId}`);
            const svgUrls = yield getFigmaSvgUrls(figmaFileKey, frameWithIconsId);
            core.info(`Start downloading...`);
            yield io.mkdirP(TEMP_SVG_PATH);
            yield downloadAllSvgs(svgUrls);
            yield setUpGit();
            if (!fs.existsSync(SVG_PATH)) {
                yield io.mkdirP(SVG_PATH);
            }
            const diffFiles = utils_1.compareDir(SVG_PATH, TEMP_SVG_PATH);
            yield io.rmRF(SVG_PATH);
            fs.renameSync(TEMP_SVG_PATH, SVG_PATH);
            const commitFilesByType = (type) => __awaiter(this, void 0, void 0, function* () {
                const breakingTypes = ["deleted"];
                const breaking = breakingTypes.includes(type);
                const files = diffFiles[type];
                const commitTypes = {
                    added: "new",
                    modified: "update",
                    deleted: "delete",
                };
                if (files.length) {
                    core.info(`${type} ${files.join(", ")}`);
                    const breakingMessage = breaking
                        ? `\n\nBREAKING CHANGE: ${files.join(", ")} was ${type}!`
                        : "";
                    yield commit(`${commitTypes[type]}(icons)${breaking ? "!" : ""}: ${type} ${files.join(", ")}${breakingMessage}`, files.map((item) => path.join(SVG_FOLDER, item)));
                }
            });
            for (const key in diffFiles) {
                yield commitFilesByType(key);
            }
            yield push();
        }
        catch (error) {
            core.setFailed(error.message);
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
    yield exec_1.exec(`git commit -m "${message}"`);
});
const push = () => exec_1.exec("git push -u origin HEAD");
run();
