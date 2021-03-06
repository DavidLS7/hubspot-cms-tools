const http = require('../http');
const CONTENT_API_PATH = 'content/api/v4';

async function fetchContent(portalId, query = {}) {
  return http.get(portalId, {
    uri: `${CONTENT_API_PATH}/contents`,
    query,
  });
}

module.exports = {
  fetchContent,
};
