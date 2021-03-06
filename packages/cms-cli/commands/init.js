const {
  getConfigPath,
  createEmptyConfigFile,
  deleteEmptyConfigFile,
  updateDefaultPortal,
  writeConfig,
  updatePortalConfig,
} = require('@hubspot/cms-lib/lib/config');
const { handleExit } = require('@hubspot/cms-lib/lib/process');
const { logErrorInstance } = require('@hubspot/cms-lib/errorHandlers');
const {
  DEFAULT_HUBSPOT_CONFIG_YAML_FILE_NAME,
  PERSONAL_ACCESS_KEY_AUTH_METHOD,
  OAUTH_AUTH_METHOD,
  API_KEY_AUTH_METHOD,
  ENVIRONMENTS,
} = require('@hubspot/cms-lib/lib/constants');
const { logger } = require('@hubspot/cms-lib/logger');
const {
  updateConfigWithPersonalAccessKey,
} = require('@hubspot/cms-lib/personalAccessKey');
const { trackCommandUsage, trackAuthAction } = require('../lib/usageTracking');
const { setLogLevel, addTestingOptions } = require('../lib/commonOpts');
const {
  OAUTH_FLOW,
  API_KEY_FLOW,
  PORTAL_NAME,
  personalAccessKeyPrompt,
  promptUser,
} = require('../lib/prompts');
const { logDebugInfo } = require('../lib/debugInfo');
const { authenticateWithOauth } = require('../lib/oauth');

const TRACKING_STATUS = {
  STARTED: 'started',
  ERROR: 'error',
  COMPLETE: 'complete',
};

const personalAccessKeyConfigCreationFlow = async env => {
  const configData = await personalAccessKeyPrompt({ env });
  const { name } = await promptUser([PORTAL_NAME]);
  const portalConfig = {
    ...configData,
    name,
  };

  await updateConfigWithPersonalAccessKey(portalConfig, true);
  return portalConfig;
};

const oauthConfigCreationFlow = async env => {
  const configData = await promptUser(OAUTH_FLOW);
  const portalConfig = {
    ...configData,
    env,
  };
  await authenticateWithOauth(portalConfig);
  updateDefaultPortal(portalConfig.name);
  return portalConfig;
};

const apiKeyConfigCreationFlow = async env => {
  const configData = await promptUser(API_KEY_FLOW);
  const portalConfig = {
    ...configData,
    env,
  };
  updatePortalConfig(portalConfig);
  updateDefaultPortal(portalConfig.name);
  writeConfig();
  return portalConfig;
};

const CONFIG_CREATION_FLOWS = {
  [PERSONAL_ACCESS_KEY_AUTH_METHOD.value]: personalAccessKeyConfigCreationFlow,
  [OAUTH_AUTH_METHOD.value]: oauthConfigCreationFlow,
  [API_KEY_AUTH_METHOD.value]: apiKeyConfigCreationFlow,
};

exports.command = 'init';
exports.describe = `initialize ${DEFAULT_HUBSPOT_CONFIG_YAML_FILE_NAME} for a HubSpot portal`;

exports.handler = async options => {
  const { auth: authType = PERSONAL_ACCESS_KEY_AUTH_METHOD.value } = options;
  const configPath = getConfigPath();
  setLogLevel(options);
  logDebugInfo(options);
  trackCommandUsage('init', {
    authType,
  });
  const env = options.qa ? ENVIRONMENTS.QA : ENVIRONMENTS.PROD;

  if (configPath) {
    logger.error(`The config file '${configPath}' already exists.`);
    logger.info(
      'To update an existing config file, use the "hs auth" command.'
    );
    process.exit(1);
  }

  trackAuthAction('init', authType, TRACKING_STATUS.STARTED);

  createEmptyConfigFile();
  handleExit(deleteEmptyConfigFile);

  try {
    const { portalId } = await CONFIG_CREATION_FLOWS[authType](env);
    const path = getConfigPath();

    logger.success(
      `The config file "${path}" was created using your personal access key for portal ${portalId}.`
    );

    trackAuthAction('init', authType, TRACKING_STATUS.COMPLETE, portalId);
    process.exit();
  } catch (err) {
    logErrorInstance(err);
    trackAuthAction('init', authType, TRACKING_STATUS.ERROR);
  }
};

exports.builder = yargs => {
  yargs.option('auth', {
    describe:
      'specify auth method to use ["personalaccesskey", "oauth2", "apikey"]',
    type: 'string',
    choices: [
      `${PERSONAL_ACCESS_KEY_AUTH_METHOD.value}`,
      `${OAUTH_AUTH_METHOD.value}`,
      `${API_KEY_AUTH_METHOD.value}`,
    ],
    default: PERSONAL_ACCESS_KEY_AUTH_METHOD.value,
    defaultDescription: `"${PERSONAL_ACCESS_KEY_AUTH_METHOD.value}": \nAn access token tied to a specific user account. This is the recommended way of authenticating with local development tools.`,
  });
  addTestingOptions(yargs, true);

  return yargs;
};
