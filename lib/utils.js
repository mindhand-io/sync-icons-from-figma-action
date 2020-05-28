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
exports.deleteFiles = exports.compareDir = exports.download = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const axios_1 = __importDefault(require("axios"));
const dir_compare_1 = require("dir-compare");
function download(params) {
    return __awaiter(this, void 0, void 0, function* () {
        const { path: savePath, url, name } = params;
        const writer = fs_1.default.createWriteStream(path_1.default.resolve(savePath, name));
        const response = yield axios_1.default({
            url,
            method: "GET",
            responseType: "stream",
        });
        response.data.pipe(writer);
        return new Promise((resolve, reject) => {
            writer.on("finish", resolve);
            writer.on("error", reject);
        });
    });
}
exports.download = download;
const compareOptions = {
    compareContent: true,
};
function compareDir(oldPath, newPath) {
    var _a;
    const added = [];
    const deleted = [];
    const modified = [];
    const result = dir_compare_1.compareSync(oldPath, newPath, compareOptions);
    if (!result.same) {
        (_a = result.diffSet) === null || _a === void 0 ? void 0 : _a.filter((item) => { var _a; return ((_a = (item.name1 || item.name2)) === null || _a === void 0 ? void 0 : _a.split(".").pop()) === "svg"; }).forEach((diff) => {
            switch (diff.state) {
                case "distinct":
                    modified.push(diff);
                    break;
                case "left":
                    deleted.push(diff);
                    break;
                case "right":
                    added.push(diff);
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
exports.compareDir = compareDir;
function deleteFiles(files, folderPath) {
    files.forEach((item) => fs_1.default.unlinkSync(path_1.default.join(folderPath, item)));
}
exports.deleteFiles = deleteFiles;
