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
Object.defineProperty(exports, "__esModule", { value: true });
const axios = require("axios");
const requestHeaders = {
    "X-FIGMA-TOKEN": process.env.FIGMA_TOKEN
};
const request = axios.create({
    baseURL: `https://api.figma.com/v1`,
    headers: requestHeaders
});
exports.getNode = (fileKey, nodeId) => __awaiter(void 0, void 0, void 0, function* () {
    const { data: { nodes } } = yield request(`/files/${fileKey}/nodes?ids=${nodeId}`);
    return nodes[decodeURIComponent(nodeId)].document.children;
});
exports.getSvgs = (fileKey, nodeIds) => __awaiter(void 0, void 0, void 0, function* () {
    const { data: { images } } = yield request(`/images/${fileKey}?ids=${nodeIds}&format=svg`);
    return images;
});
