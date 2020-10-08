const { getEnv } = require('@hubspot/cms-lib/lib/config');
const { ENVIRONMENTS } = require('@hubspot/cms-lib/lib/constants');
const { getHubSpotWebsiteOrigin } = require('@hubspot/cms-lib/lib/urls');
const { logger } = require('@hubspot/cms-lib/logger');
const chalk = require('chalk');
const { table, getBorderCharacters } = require('table');
const open = require('open');

const logSiteLinks = links => {
  const linksAsArray = Object.values(links)
    .sort((a, b) => (a.shortcut < b.shortcut ? -1 : 1))
    .map(l => [
      `${l.shortcut}${l.alias ? ` [alias: ${l.alias}]` : ''}`,
      '=>',
      l.url,
    ]);

  linksAsArray.unshift([chalk.bold('Shortcut'), '', chalk.bold('Url')]);

  const tableConfig = {
    singleLine: true,
    border: getBorderCharacters(`void`),
  };

  logger.log(table(linksAsArray, tableConfig));
};

const getSiteLinks = portalId => {
  const baseUrl = getHubSpotWebsiteOrigin(
    getEnv() === 'qa' ? ENVIRONMENTS.QA : ENVIRONMENTS.PROD
  );

  return {
    APPS_MARKETPLACE: {
      shortcut: 'apps-marketplace',
      alias: 'apm',
      url: `${baseUrl}/ecosystem/${portalId}/marketplace/apps`,
    },
    ASSET_MARKETPLACE: {
      shortcut: 'asset-marketplace',
      alias: 'asm',
      url: `${baseUrl}/ecosystem/${portalId}/marketplace/products`,
    },
    CONTENT_STAGING: {
      shortcut: 'content-staging',
      alias: 'cs',
      url: `${baseUrl}/content/${portalId}/staging`,
    },
    DESIGN_MANAGER: {
      shortcut: 'design-manager',
      alias: 'dm',
      url: `${baseUrl}/design-manager/${portalId}`,
    },
    DOCS: {
      shortcut: 'docs',
      url: 'https://developers.hubspot.com',
    },
    FILE_MANAGER: {
      shortcut: 'file-manager',
      alias: 'fm',
      url: `${baseUrl}/files/${portalId}`,
    },
    FORUMS: {
      shortcut: 'forums',
      url: 'https://community.hubspot.com',
    },
    HUBDB: {
      shortcut: 'hubdb',
      alias: 'hdb',
      url: `${baseUrl}/hubdb/${portalId}`,
    },
    SETTINGS: {
      shortcut: 'settings',
      alias: 's',
      url: `${baseUrl}/settings/${portalId}`,
    },
    SETTINGS_NAVIGATION: {
      shortcut: 'settings/navigation',
      alias: 'sn',
      url: `${baseUrl}/menus/${portalId}/edit/`,
    },
    SETTINGS_PAGE: {
      shortcut: 'settings/page',
      alias: 'sp',
      url: `${baseUrl}/settings/${portalId}/website/pages/all-domains/page-templates`,
    },
    SETTINGS_URL_REDIRECTS: {
      shortcut: 'settings/url-redirects',
      alias: 'sur',
      url: `${baseUrl}/domains/${portalId}/url-redirects`,
    },
    PURCHASED_ASSETS: {
      shortcut: 'purchased-assets',
      alias: 'pa',
      url: `${baseUrl}/marketplace/${portalId}/manage-purchases`,
    },

    WEBSITE_PAGES: {
      shortcut: 'website-pages',
      alias: 'wp',
      url: `${baseUrl}/website/${portalId}/pages/site`,
    },
  };
};

const openLink = (portalId, shortcut) => {
  const match = Object.values(getSiteLinks(portalId)).find(
    l => l.shortcut === shortcut || (l.alias && l.alias === shortcut)
  );

  if (!match) {
    logger.error(
      `We couldn't find a shortcut matching ${shortcut}.  Type 'hs open list' to see a list of available shortcuts`
    );
    return;
  }

  open(match.url, { url: true });
  logger.success(`We opened ${match.url} in your browser`);
};

module.exports = {
  getSiteLinks,
  logSiteLinks,
  openLink,
};