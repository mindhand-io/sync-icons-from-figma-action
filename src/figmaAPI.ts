const axios = require("axios");

const requestHeaders = {
  "X-FIGMA-TOKEN": process.env.FIGMA_TOKEN
};

const request = axios.create({
  baseURL: `https://api.figma.com/v1`,
  headers: requestHeaders
});

export const getNode = async (fileKey: string, nodeId: string) => {
  const {
    data: { nodes }
  } = await request(`/files/${fileKey}/nodes?ids=${nodeId}`);
  return nodes[decodeURIComponent(nodeId)].document.children;
};

export const getSvgs = async (fileKey: string, nodeIds: string) => {
  const {
    data: { images }
  } = await request(`/images/${fileKey}?ids=${nodeIds}&format=svg`);
  return images;
};
