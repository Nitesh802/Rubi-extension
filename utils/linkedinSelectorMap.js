/**
 * Rubi Browser Extension - LinkedIn Selector Map
 *
 * LinkedIn-specific selector configurations for fallback extraction.
 * This file follows the pattern of selectorMaps.js but is dedicated to LinkedIn.
 */

/**
 * LinkedIn Profile Page Selectors
 */
const LINKEDIN_PROFILE_SELECTORS = {
  fullName: {
    primary: [
      'main h1.text-heading-xlarge',
      '.pv-text-details__left-panel h1',
      'main h1'
    ],
    secondary: [
      '.pv-top-card--list h1',
      'h1'
    ],
    fallback: {
      strategy: 'scan-headings',
      pattern: /^[A-Z][a-z]+ [A-Z][a-z]+/
    }
  },

  headline: {
    primary: [
      'div.text-body-medium.break-words',
      '.pv-text-details__left-panel .text-body-medium'
    ],
    secondary: [
      '.pv-top-card--list .text-body-medium'
    ],
    fallback: null
  },

  location: {
    primary: [
      'span.text-body-small.inline.t-black--light.break-words',
      '.pv-text-details__left-panel .text-body-small'
    ],
    secondary: [
      '.pv-top-card--list .text-body-small'
    ],
    fallback: null
  },

  about: {
    primary: [
      'section[data-section="summary"] .inline-show-more-text',
      'section#about .inline-show-more-text',
      'div.pv-shared-text-with-see-more span[aria-hidden="true"]'
    ],
    secondary: null,
    fallback: null
  },

  experience: {
    primary: [
      'section[data-section="experience"] .pvs-list__container',
      'section#experience .pvs-list__container'
    ],
    secondary: null,
    fallback: null
  }
};

/**
 * LinkedIn Company Page Selectors
 */
const LINKEDIN_COMPANY_SELECTORS = {
  companyName: {
    primary: [
      '.org-top-card-summary__title',
      'h1.org-top-card-summary__title',
      'main h1'
    ],
    secondary: [
      '.org-top-card h1'
    ],
    fallback: {
      strategy: 'scan-headings',
      selector: 'main h1'
    }
  },

  industry: {
    primary: [
      '.org-top-card-summary-info-list__info-item:contains("Industry")',
      '.org-page-details__definition-text'
    ],
    secondary: null,
    fallback: null
  },

  size: {
    primary: [
      '.org-top-card-summary-info-list__info-item:contains("Company size")',
      '.org-about-company-module__company-size-definition-text'
    ],
    secondary: null,
    fallback: null
  },

  website: {
    primary: [
      '.org-top-card-primary-actions__inner a[href*="http"]',
      '.org-about-us-organization-description__website a'
    ],
    secondary: null,
    fallback: null
  },

  about: {
    primary: [
      'section.org-about-us-organization-description p',
      '.org-about-us-organization-description__text'
    ],
    secondary: null,
    fallback: null
  }
};

/**
 * LinkedIn Job Page Selectors
 */
const LINKEDIN_JOB_SELECTORS = {
  jobTitle: {
    primary: [
      '.jobs-unified-top-card__job-title',
      'h1.t-24',
      '.job-details-jobs-unified-top-card__job-title h1'
    ],
    secondary: [
      '.jobs-details-top-card__job-title h2'
    ],
    fallback: {
      strategy: 'scan-headings',
      selector: 'main h1, main h2'
    }
  },

  companyName: {
    primary: [
      '.jobs-unified-top-card__company-name a',
      '.job-details-jobs-unified-top-card__company-name a'
    ],
    secondary: [
      '.jobs-details-top-card__company-name a'
    ],
    fallback: null
  },

  location: {
    primary: [
      '.jobs-unified-top-card__bullet',
      '.job-details-jobs-unified-top-card__primary-description-container .t-black--light'
    ],
    secondary: null,
    fallback: null
  },

  description: {
    primary: [
      '.jobs-description__content',
      '.jobs-box__html-content'
    ],
    secondary: null,
    fallback: null
  }
};

/**
 * LinkedIn Search Page Selectors
 */
const LINKEDIN_SEARCH_SELECTORS = {
  topPeople: {
    primary: [
      '.search-results__list .entity-result__title-text a',
      '.reusable-search__result-container .entity-result__title-text a'
    ],
    secondary: null,
    fallback: null
  },

  topCompanies: {
    primary: [
      '.search-results__list .entity-result__title-text a',
      '.reusable-search__result-container .entity-result__title-text a'
    ],
    secondary: null,
    fallback: null
  },

  topJobs: {
    primary: [
      '.job-card-container__link',
      '.jobs-search-results__list-item a'
    ],
    secondary: null,
    fallback: null
  }
};

/**
 * Get LinkedIn selector map for a given page type
 *
 * @param {string} pageType - LinkedIn page type (profile, company, job, search)
 * @returns {Object|null} Selector map or null if not found
 */
function getLinkedInSelectorMap(pageType) {
  const selectorMaps = {
    profile: LINKEDIN_PROFILE_SELECTORS,
    company: LINKEDIN_COMPANY_SELECTORS,
    job: LINKEDIN_JOB_SELECTORS,
    search: LINKEDIN_SEARCH_SELECTORS
  };

  return selectorMaps[pageType] || null;
}

/**
 * Get list of required fields for a given LinkedIn page type
 *
 * @param {string} pageType - LinkedIn page type
 * @returns {Array<string>} Array of required field names
 */
function getLinkedInRequiredFields(pageType) {
  const requiredFields = {
    profile: ['fullName', 'headline'],
    company: ['companyName'],
    job: ['jobTitle', 'companyName'],
    search: ['topPeople', 'topCompanies', 'topJobs']
  };

  return requiredFields[pageType] || [];
}

// Export for use in content scripts
if (typeof window !== 'undefined') {
  window.RubiLinkedInSelectorMap = {
    getLinkedInSelectorMap,
    getLinkedInRequiredFields
  };
}
