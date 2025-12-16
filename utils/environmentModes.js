window.RubiEnvironmentModes = (() => {
  const MODES = {
    local: {
      name: 'Local Development',
      description: 'Local development with mock data',
      config: {
        backendUrl: 'http://localhost:3000',
        moodleUrl: 'http://localhost:8080',
        extensionAuthToken: 'local-dev-token',
        debugEnabled: true,
        offlineMode: false,
        mockIdentity: true,
        cacheEnabled: false
      }
    },
    staging: {
      name: 'Staging',
      description: 'Staging environment for testing',
      config: {
        backendUrl: 'https://staging-api.rubi.ai',
        moodleUrl: 'https://staging-moodle.rubi.ai',
        extensionAuthToken: 'TOKEN_GOES_HERE',
        debugEnabled: true,
        offlineMode: false,
        mockIdentity: false,
        cacheEnabled: true
      }
    },
    production: {
      name: 'Production',
      description: 'Production environment',
      config: {
        backendUrl: 'https://api.rubi.ai',
        moodleUrl: 'https://moodle.rubi.ai',
        extensionAuthToken: 'TOKEN_GOES_HERE',
        debugEnabled: false,
        offlineMode: false,
        mockIdentity: false,
        cacheEnabled: true
      }
    },
    offline: {
      name: 'Offline',
      description: 'Forced offline mode',
      config: {
        backendUrl: null,
        moodleUrl: null,
        extensionAuthToken: null,
        debugEnabled: true,
        offlineMode: true,
        mockIdentity: true,
        cacheEnabled: false
      }
    }
  };

  let currentMode = 'local';
  let modeOverrides = {};
  let listeners = [];

  const detectMode = () => {
    if (window.location.hostname === 'localhost') {
      return 'local';
    }
    if (window.location.hostname.includes('staging')) {
      return 'staging';
    }
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      const manifest = chrome.runtime.getManifest();
      if (manifest.version_name?.includes('dev')) {
        return 'local';
      }
      if (manifest.version_name?.includes('staging')) {
        return 'staging';
      }
    }
    return 'production';
  };

  const loadStoredMode = async () => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      return new Promise((resolve) => {
        chrome.storage.local.get(['rubiEnvironmentMode', 'rubiModeOverrides'], (result) => {
          if (result.rubiEnvironmentMode && MODES[result.rubiEnvironmentMode]) {
            currentMode = result.rubiEnvironmentMode;
          }
          if (result.rubiModeOverrides) {
            modeOverrides = result.rubiModeOverrides;
          }
          resolve();
        });
      });
    }
  };

  const saveMode = async () => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.set({
        rubiEnvironmentMode: currentMode,
        rubiModeOverrides: modeOverrides
      });
    }
  };

  const notifyListeners = () => {
    const config = getConfig();
    listeners.forEach(callback => {
      try {
        callback(currentMode, config);
      } catch (error) {
        console.error('[Rubi Environment] Listener error:', error);
      }
    });
  };

  const init = async () => {
    await loadStoredMode();
    if (!MODES[currentMode]) {
      currentMode = detectMode();
    }
    console.log('[Rubi Environment] Initialized in', currentMode, 'mode');
    return currentMode;
  };

  const getConfig = () => {
    const base = MODES[currentMode] || MODES.local;
    return { ...base.config, ...modeOverrides };
  };

  const setMode = async (mode) => {
    if (!MODES[mode]) {
      console.error('[Rubi Environment] Invalid mode:', mode);
      return false;
    }
    
    const previousMode = currentMode;
    currentMode = mode;
    modeOverrides = {};
    await saveMode();
    
    console.log('[Rubi Environment] Mode changed from', previousMode, 'to', mode);
    notifyListeners();
    
    return true;
  };

  const override = async (key, value) => {
    modeOverrides[key] = value;
    await saveMode();
    notifyListeners();
  };

  const clearOverrides = async () => {
    modeOverrides = {};
    await saveMode();
    notifyListeners();
  };

  const onModeChange = (callback) => {
    if (typeof callback === 'function') {
      listeners.push(callback);
      return () => {
        listeners = listeners.filter(cb => cb !== callback);
      };
    }
  };

  const testConnectivity = async () => {
    const config = getConfig();
    const results = {
      backend: false,
      moodle: false,
      timestamp: new Date().toISOString()
    };

    if (config.offlineMode) {
      console.log('[Rubi Environment] Offline mode - skipping connectivity test');
      return results;
    }

    if (config.backendUrl) {
      try {
        const response = await fetch(`${config.backendUrl}/api/actions/health`, {
          method: 'GET',
          headers: {
            'X-Extension-Token': config.extensionAuthToken
          },
          signal: AbortSignal.timeout(5000)
        });
        results.backend = response.ok;
      } catch (error) {
        console.error('[Rubi Environment] Backend connectivity test failed:', error);
      }
    }

    if (config.moodleUrl && window.RubiSessionBridge) {
      try {
        const identity = await window.RubiSessionBridge.getCurrentIdentity();
        results.moodle = !!identity;
      } catch (error) {
        console.error('[Rubi Environment] Moodle connectivity test failed:', error);
      }
    }

    return results;
  };

  const getStatus = () => {
    const config = getConfig();
    return {
      mode: currentMode,
      modeName: MODES[currentMode]?.name || 'Unknown',
      config: config,
      hasOverrides: Object.keys(modeOverrides).length > 0,
      overrides: modeOverrides,
      availableModes: Object.keys(MODES)
    };
  };

  init();

  return {
    init,
    getConfig,
    setMode,
    override,
    clearOverrides,
    onModeChange,
    testConnectivity,
    getStatus,
    getCurrentMode: () => currentMode,
    getAvailableModes: () => Object.keys(MODES),
    getModeInfo: (mode) => MODES[mode] || null,
    isOffline: () => getConfig().offlineMode === true,
    isDebugEnabled: () => getConfig().debugEnabled === true,
    isProduction: () => currentMode === 'production',
    isDevelopment: () => currentMode === 'local'
  };
})();