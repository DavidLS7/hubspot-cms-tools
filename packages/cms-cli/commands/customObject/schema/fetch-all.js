const {
  loadConfig,
  validateConfig,
  checkAndWarnGitInclusion,
} = require('@hubspot/cms-lib');
const { logger } = require('@hubspot/cms-lib/logger');
const { logErrorInstance } = require('@hubspot/cms-lib/errorHandlers');

const { validatePortal } = require('../../../lib/validation');
const { trackCommandUsage } = require('../../../lib/usageTracking');
const { setLogLevel, getPortalId } = require('../../../lib/commonOpts');
const { logDebugInfo } = require('../../../lib/debugInfo');
const { downloadSchemas, getResolvedPath } = require('@hubspot/cms-lib/schema');

exports.command = 'fetch-all [dest]';
exports.describe = 'Fetch all custom object schemas for a portal';

exports.handler = async options => {
  setLogLevel(options);
  logDebugInfo(options);
  loadConfig(options.config);
  checkAndWarnGitInclusion();

  if (!(validateConfig() && (await validatePortal(options)))) {
    process.exit(1);
  }
  const portalId = getPortalId(options);

  trackCommandUsage('custom-object-schema-fetch-all', null, portalId);

  try {
    await downloadSchemas(portalId, options.dest);
    logger.success(`Saved schemas to ${getResolvedPath(options.dest)}`);
  } catch (e) {
    logErrorInstance(e);
    logger.error('Unable to fetch schemas');
  }
};

exports.builder = yargs => {
  yargs.example([
    [
      '$0 custom-object schema fetch-all',
      'Fetch all schemas for a portal and put them in the current working directory',
    ],
    [
      '$0 custom-object schema fetch-all my/folder',
      'Fetch all schemas for a portal and put them in a directory named my/folder',
    ],
  ]);

  yargs.positional('dest', {
    describe: 'Local folder where schemas will be written',
    type: 'string',
  });
};
