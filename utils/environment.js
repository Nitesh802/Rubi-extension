window.RubiEnvironment = (() => {
  const ENVIRONMENTS = {
    local: {
      name: 'local',
      backendUrl: 'http://localhost:3000',
      moodleUrl: 'http://localhost:8080',
      extensionAuthToken: 'local-dev-token',
      debugEnabled: true,
      offlineMode: false
    },
    staging: {
      name: 'staging',
      backendUrl: 'https://staging-api.rubi.ai',
      moodleUrl: 'https://staging-moodle.rubi.ai',
      extensionAuthToken: 'TOKEN_GOES_HERE',
      debugEnabled: true,
      offlineMode: false
    },
    production: {
      name: 'production',
      backendUrl: 'https://api.rubi.ai',
      moodleUrl: 'https://moodle.rubi.ai',
      extensionAuthToken: 'TOKEN_GOES_HERE',
      debugEnabled: false,
      offlineMode: false
    },
    offline: {
      name: 'offline',
      backendUrl: null,
      moodleUrl: null,
      extensionAuthToken: null,
      debugEnabled: true,
      offlineMode: true
    }
  };

  let currentEnvironment = 'local';
  let overrides = {};

  const detectEnvironment = () => {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      const manifest = chrome.runtime.getManifest();
      if (manifest.version_name && manifest.version_name.includes('dev')) {
        return 'local';
      }
      if (manifest.version_name && manifest.version_name.includes('staging')) {
        return 'staging';
      }
    }
    if (window.location && window.location.hostname === 'localhost') {
      return 'local';
    }
    return 'production';
  };

  const loadStoredConfig = async () => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      return new Promise((resolve) => {
        chrome.storage.local.get(['rubiEnvironment', 'rubiEnvOverrides'], (result) => {
          if (result.rubiEnvironment) {
            currentEnvironment = result.rubiEnvironment;
          }
          if (result.rubiEnvOverrides) {
            overrides = result.rubiEnvOverrides;
          }
          resolve();
        });
      });
    }
  };

  const saveConfig = async () => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.set({
        rubiEnvironment: currentEnvironment,
        rubiEnvOverrides: overrides
      });
    }
  };

  const init = async () => {
    await loadStoredConfig();
    if (!ENVIRONMENTS[currentEnvironment]) {
      currentEnvironment = detectEnvironment();
    }
  };

  const getConfig = () => {
    const base = ENVIRONMENTS[currentEnvironment] || ENVIRONMENTS.local;
    return { ...base, ...overrides };
  };

  const setEnvironment = async (env) => {
    if (ENVIRONMENTS[env]) {
      currentEnvironment = env;
      overrides = {};
      await saveConfig();
      return true;
    }
    return false;
  };

  const setOverride = async (key, value) => {
    overrides[key] = value;
    await saveConfig();
  };

  const clearOverrides = async () => {
    overrides = {};
    await saveConfig();
  };

  const isOffline = () => {
    const config = getConfig();
    return config.offlineMode === true;
  };

  const getBackendUrl = () => {
    const config = getConfig();
    return config.backendUrl;
  };

  const getMoodleUrl = () => {
    const config = getConfig();
    return config.moodleUrl;
  };

  const getAuthToken = () => {
    const config = getConfig();
    return config.extensionAuthToken;
  };

  const isDebugEnabled = () => {
    const config = getConfig();
    return config.debugEnabled === true;
  };

  init();

  return {
    init,
    getConfig,
    setEnvironment,
    setOverride,
    clearOverrides,
    isOffline,
    getBackendUrl,
    getMoodleUrl,
    getAuthToken,
    isDebugEnabled,
    getCurrentEnvironment: () => currentEnvironment,
    getAvailableEnvironments: () => Object.keys(ENVIRONMENTS)
  };
})();