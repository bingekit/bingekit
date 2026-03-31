export interface FormExtraAction {
  id: string;
  selector: string;
  action: 'setValue' | 'check' | 'uncheck' | 'click' | 'setAttribute' | 'removeAttribute';
  value: string;
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
  siteId: string;
  type: 'tv' | 'film';
  knownCount: number;
  hasUpdate: boolean;
  imgUrl?: string;
}

export interface HistoryItem {
  id: string;
  url: string;
  title: string;
  timestamp: number;
  domain: string;
}

export interface DiscoveryItem {
  id: string;
  url: string;
  title: string;
  siteId: string;
  addedAt: number;
  tags?: string[];
  dismissed?: boolean;
}

export interface FlowStep {
  id: string;
  type: 'RawFetchHTML' | 'parseHtml' | 'pluginAction' | 'navigate' | 'extract' | 'inject' | 'callFlow' | 'callPlugin' | 'smartFetch' | 'smartSearch' | 'jsExtract' | 'customSmartFetch' | 'aggregateSmartSearch' | 'wait' | 'waitForElement' | 'interact' | 'waitForNavigate';
  params: Record<string, any>;
}

export interface CustomFlow {
  id: string;
  name: string;
  description: string;
  variables?: string[];
  steps: FlowStep[];
  enabled?: boolean;
}

export interface Userscript {
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
}

export interface SitePlugin {
  id: string;
  name: string;
  baseUrl: string;
  auth: {
    loginUrl: string;
    userSel: string;
    passSel: string;
    submitSel: string;
    usernameValue: string;
    passwordValue: string;
    encryptCreds: boolean;
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
  };
  additionalSearches?: SearchConfig[];
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
  };
  tags?: string[];
  customFunctions: {
    name: string;
    description: string;
    code: string;
  }[];
  customCss?: string;
  customJs?: string;
}

export const DEFAULT_PLUGIN: SitePlugin = {
  id: '',
  name: 'New Site Plugin',
  baseUrl: 'https://',
  auth: { loginUrl: '', userSel: '', passSel: '', submitSel: '', usernameValue: '', passwordValue: '', encryptCreds: true },
  search: { urlFormat: '', itemSel: '', titleSel: '', linkSel: '', imgSel: '', yearSel: '', typeSel: '', isFormSearch: false, formInputSel: '', formSubmitSel: '', searchWaitMode: 'navigation', formSubmitDelay: 2000, formExtraActions: [] },
  additionalSearches: [],
  enabled: true,
  details: { titleSel: '', descSel: '', castSel: '', ratingSel: '', posterSel: '', similarSel: '' },
  media: { seasonSel: '', epSel: '', deepJs: '' },
  player: { playerSel: '', focusCss: 'position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: 9999; background: #000;' },
  tags: [],
  customFunctions: [],
  customCss: '',
  customJs: ''
};
