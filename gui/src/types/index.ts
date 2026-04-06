export interface FormExtraAction {
  id: string;
  selector: string;
  action: 'setValue' | 'check' | 'uncheck' | 'click' | 'setAttribute' | 'removeAttribute';
  value: string;
}

export interface BaseMetadata {
  version?: string;
  updateUrl?: string;
  author?: string;
  description?: string;
  icon?: string;
}

export interface BookmarkItem {
  id: string;
  title: string;
  url: string;
  icon?: string;
  tags?: string[];
  folder?: string;
}

export interface WatchLaterItem {
  id: string;
  title: string;
  url: string;
  addedAt: number;
}

export interface CredentialItem {
  id: string;
  domain: string;
  username: string;
  passwordBase64: string;
}

export interface FollowedItem {
  id: string;
  title: string;
  url: string;
  siteId: string; // Primary site ID
  type: 'tv' | 'film';
  knownCount: number; // For legacy or simple tracking
  hasUpdate: boolean;
  imgUrl?: string;
  watchedEpisodes?: string[]; // List of IDs e.g., 's01e01' or 'e1'
  latestAvailable?: string; // latest known episode ID or empty if film
  releaseStatus?: 'unreleased' | 'released' | 'ongoing' | 'ended';
  aliases?: string[]; // For cross-site matching
  crossSiteData?: Record<string, string>; // siteId -> matched url on that site
  trackingFlowId?: string; // Uses a specific tracking config flow ID on the plugin
  label?: string; // Shared tracking group ID to sync stats across different sites!
}

export interface HistoryItem {
  id: string;
  url: string;
  title: string;
  timestamp: number;
  domain: string;
  type?: 'browse' | 'watch';
  watchDuration?: number;
  tags?: string[];
  currentTime?: number;
  duration?: number;
}

export interface ActiveDownload {
  path: string;
  file: string;
  total: number;
  rcv: number;
  state: number; // 0=InProgress, 1=Interrupted, 2=Completed
  speed?: string;
  ffmpegTime?: string;
  isFFmpeg?: boolean;
}

export interface DiscoveryItem {
  id: string;
  url: string;
  title: string;
  siteId: string;
  addedAt: number;
  tags?: string[];
  dismissed?: boolean;
  imgUrl?: string;
}

export interface FlowStep {
  id: string;
  type: 'RawFetchHTML' | 'parseHtml' | 'pluginAction' | 'navigate' | 'extract' | 'inject' | 'callFlow' | 'callPlugin' | 'smartFetch' | 'smartSearch' | 'jsExtract' | 'customSmartFetch' | 'aggregateSmartSearch' | 'wait' | 'waitForElement' | 'interact' | 'waitForNavigate';
  params: Record<string, any>;
}

export interface CustomFlow extends BaseMetadata {
  id: string;
  name: string;
  description: string;
  variables?: string[];
  steps: FlowStep[];
  enabled?: boolean;
}

export interface Userscript extends BaseMetadata {
  id: string;
  name: string;
  domains: string[];
  code: string;
  enabled: boolean;
}

export interface SearchConfig {
  id: string;
  name: string;
  tags?: string[];
  urlFormat: string;
  itemSel: string;
  titleSel: string;
  linkSel: string;
  imgSel: string;
  yearSel: string;
  typeSel: string;
  isFormSearch?: boolean;
  formInputSel?: string;
  formSubmitSel?: string;
  searchWaitMode?: 'ajax' | 'navigation';
  formSubmitDelay?: number;
  formExtraActions?: FormExtraAction[];
  delegateFlowId?: string;
  delegateFlowInputs?: Record<string, string>;
  costSel?: string;
  rentBuySel?: string;
  priceExtractJs?: string;
}

export interface TrackingConfig {
  id?: string;
  name?: string;
  urlRegex?: string;
  urlPattern?: string; // Format like: https://example.com/show/{id}
  listSel?: string; // List of episodes container
  itemSel?: string; // Individual episode item
  idExtractJs?: string; // JS to return standard ID (e.g. 's01e01')
  titleExtractJs?: string; // JS to return episode title
  urlExtractJs?: string; // JS to return episode URL
  statusExtractJs?: string; // JS to return release status
}

export interface SitePlugin extends BaseMetadata {
  id: string;
  name: string;
  baseUrl: string;
  auth: {
    loginUrl: string;
    loginUrlJs?: string;
    captchaSel?: string;
    userSel: string;
    passSel: string;
    submitSel: string;
    usernameValue: string;
    passwordValue: string;
    encryptCreds: boolean;
    checkAuthJs?: string;
    customLoginJs?: string;
    skipSel?: string;
    checkAuthOnSearch?: boolean;
  };
  search: {
    urlFormat: string;
    itemSel: string;
    titleSel: string;
    linkSel: string;
    imgSel: string;
    yearSel: string;
    typeSel: string;
    isFormSearch?: boolean;
    formInputSel?: string;
    formSubmitSel?: string;
    searchWaitMode?: 'ajax' | 'navigation';
    formSubmitDelay?: number;
    formExtraActions?: FormExtraAction[];
    delegateFlowId?: string;
    delegateFlowInputs?: Record<string, string>;
    costSel?: string;
    rentBuySel?: string;
    priceExtractJs?: string;
  };
  additionalSearches?: SearchConfig[];
  networkBlockers?: string[];
  inlineBlockers?: string[];
  redirectBlockers?: string[];
  elementBlockers?: string;
  enabled?: boolean;
  details: {
    titleSel: string;
    descSel: string;
    castSel: string;
    ratingSel: string;
    posterSel: string;
    similarSel: string;
    similarTitleSel?: string;
    similarLinkSel?: string;
    similarImageSel?: string;
    delegateFlowId?: string;
    delegateFlowInputs?: Record<string, string>;
  };
  media: {
    seasonSel: string;
    epSel: string;
    deepJs?: string;
  };
  player: {
    playerSel: string;
    focusCss: string;
    ignoreVideoUrls?: string;
    ignoreVideoCSS?: string;
  };
  tags?: string[];
  customFunctions: {
    name: string;
    description: string;
    code: string;
  }[];
  customCss?: string;
  customJs?: string;
  botCheckJs?: string;
  tracking?: TrackingConfig; // Legacy fallback single tracking object
  trackingFlows?: TrackingConfig[]; // Multiple tracking flows for specific URLs
  blockedExts?: string[];
}

export const DEFAULT_PLUGIN: SitePlugin = {
  id: '',
  name: 'New Site Plugin',
  description: '',
  version: '1.0.0',
  author: '',
  updateUrl: '',
  icon: '',
  baseUrl: 'https://',
  auth: { loginUrl: '', loginUrlJs: '', captchaSel: '', userSel: '', passSel: '', submitSel: '', usernameValue: '', passwordValue: '', encryptCreds: true, checkAuthJs: '', customLoginJs: '', skipSel: '', checkAuthOnSearch: false },
  search: { urlFormat: '', itemSel: '', titleSel: '', linkSel: '', imgSel: '', yearSel: '', typeSel: '', isFormSearch: false, formInputSel: '', formSubmitSel: '', searchWaitMode: 'navigation', formSubmitDelay: 2000, formExtraActions: [], costSel: '', rentBuySel: '', priceExtractJs: '' },
  additionalSearches: [],
  networkBlockers: [],
  inlineBlockers: [],
  redirectBlockers: [],
  elementBlockers: '',
  enabled: true,
  details: { titleSel: '', descSel: '', castSel: '', ratingSel: '', posterSel: '', similarSel: '' },
  media: { seasonSel: '', epSel: '', deepJs: '' },
  player: { playerSel: '', focusCss: 'position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: 9999; background: #000;' },
  tags: [],
  customFunctions: [],
  customCss: '',
  customJs: '',
  botCheckJs: '',
  tracking: { listSel: '', itemSel: '', idExtractJs: '', titleExtractJs: '', urlExtractJs: '', statusExtractJs: '' },
  trackingFlows: [],
  blockedExts: []
};

export interface RepoPlugin {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  tags?: string[];
  icon?: string;
  zipUrl: string;
}

export interface RepoPack {
  id: string;
  name: string;
  description: string;
  plugins: string[];
}

export interface RepoManifest {
  name: string;
  description: string;
  version: string;
  plugins: RepoPlugin[];
  packs: RepoPack[];
}
