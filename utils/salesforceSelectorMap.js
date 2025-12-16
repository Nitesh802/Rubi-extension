/**
 * Rubi Browser Extension - Salesforce Selector Map
 *
 * Salesforce-specific selector configurations for Salesforce Lightning DOM.
 * This file follows the pattern of linkedinSelectorMap.js but is tailored to Salesforce fields.
 */

/**
 * Salesforce Opportunity Page Selectors
 */
const SALESFORCE_OPPORTUNITY_SELECTORS = {
  opportunityName: {
    primary: [
      'records-record-layout-item[field-label*="Name"] lightning-formatted-text',
      'records-record-layout-item[field-label*="Opportunity Name"] lightning-formatted-text',
      '.slds-page-header__title',
      'h1.pageType'
    ],
    secondary: [
      'span[title*="Opportunity"] span[data-aura-class]',
      'span.uiOutputText[data-aura-rendered-by]',
      'h1 span:not([class])'
    ],
    fallback: {
      strategy: 'scan-headings',
      pattern: /^(?!Home|Lightning|Sales|Setup).{3,}/
    }
  },

  stage: {
    primary: [
      'records-record-layout-item[field-label*="Stage"] lightning-formatted-text',
      'lightning-formatted-text[data-output-element-id*="stage"]',
      'span[data-field-id*="StageName"] span'
    ],
    secondary: [
      'span[title*="Stage"] + span',
      '.slds-form-element__static[data-stage]'
    ],
    fallback: {
      strategy: 'scan-known-stages',
      pattern: /^(prospecting|qualification|needs analysis|value proposition|id\. decision makers|perception analysis|proposal\/price quote|negotiation\/review|closed won|closed lost)$/i
    }
  },

  amount: {
    primary: [
      'records-record-layout-item[field-label*="Amount"] lightning-formatted-number',
      'lightning-formatted-number[data-output-element-id*="amount"]',
      'lightning-formatted-text[data-output-element-id*="amount"]'
    ],
    secondary: [
      'span[title*="Amount"] + span',
      '.uiOutputCurrency'
    ],
    fallback: {
      strategy: 'scan-currency',
      pattern: /\$[\d,]+\.?\d*/
    }
  },

  closeDate: {
    primary: [
      'records-record-layout-item[field-label*="Close Date"] lightning-formatted-text',
      'lightning-formatted-text[data-output-element-id*="closedate"]',
      'span[data-field-id*="CloseDate"] span'
    ],
    secondary: [
      'span[title*="Close Date"] + span',
      '.slds-form-element__static[data-date]'
    ],
    fallback: {
      strategy: 'scan-dates',
      pattern: /\d{1,2}\/\d{1,2}\/\d{4}/
    }
  },

  accountName: {
    primary: [
      'records-record-layout-item[field-label*="Account Name"] lightning-formatted-lookup a span',
      'lightning-formatted-lookup[data-output-element-id*="account"] a span',
      'a[data-refid="recordId"][title*="Account"] span'
    ],
    secondary: [
      'span[title*="Account"] a span',
      '.forceRecordLayout a[data-refid] span'
    ],
    fallback: {
      strategy: 'scan-nearby-label',
      label: 'Account Name'
    }
  },

  probability: {
    primary: [
      'records-record-layout-item[field-label*="Probability"] lightning-formatted-text',
      'lightning-formatted-text[data-output-element-id*="probability"]',
      'span[data-field-id*="Probability"] span'
    ],
    secondary: [
      'span[title*="Probability"] + span',
      '.slds-form-element__static[data-percent]'
    ],
    fallback: {
      strategy: 'scan-percentage',
      pattern: /\d+%/
    }
  },

  description: {
    primary: [
      'records-record-layout-item[field-label*="Description"] lightning-formatted-rich-text',
      'lightning-formatted-rich-text[data-output-element-id*="description"]',
      'records-record-layout-item[field-label*="Description"] lightning-formatted-text'
    ],
    secondary: [
      'span[title*="Description"] + div',
      '.slds-form-element__static[data-description]'
    ],
    fallback: {
      strategy: 'scan-nearby-label',
      label: 'Description'
    }
  },

  nextStep: {
    primary: [
      'records-record-layout-item[field-label*="Next Step"] lightning-formatted-text',
      'lightning-formatted-text[data-output-element-id*="nextstep"]',
      'records-record-layout-item[field-label*="Next Step"] lightning-formatted-rich-text'
    ],
    secondary: [
      'span[title*="Next Step"] + span',
      '.slds-form-element__static[data-nextstep]'
    ],
    fallback: {
      strategy: 'scan-nearby-label',
      label: 'Next Step'
    }
  },

  ownerName: {
    primary: [
      'records-record-layout-item[field-label*="Opportunity Owner"] lightning-formatted-lookup a span',
      'records-record-layout-item[field-label*="Owner"] lightning-formatted-lookup a span',
      'lightning-formatted-lookup[data-output-element-id*="owner"] a span'
    ],
    secondary: [
      'span[title*="Owner"] a span',
      '.forceRecordLayout a[data-refid*="User"] span'
    ],
    fallback: {
      strategy: 'scan-nearby-label',
      label: 'Opportunity Owner'
    }
  },

  // Non-required fields for future features
  leadSource: {
    primary: [
      'records-record-layout-item[field-label*="Lead Source"] lightning-formatted-text',
      'lightning-formatted-text[data-output-element-id*="leadsource"]'
    ],
    secondary: [
      'span[title*="Lead Source"] + span'
    ],
    fallback: null
  },

  type: {
    primary: [
      'records-record-layout-item[field-label*="Type"] lightning-formatted-text',
      'lightning-formatted-text[data-output-element-id*="type"]'
    ],
    secondary: [
      'span[title*="Type"] + span'
    ],
    fallback: null
  },

  campaignName: {
    primary: [
      'records-record-layout-item[field-label*="Campaign"] lightning-formatted-lookup a span',
      'lightning-formatted-lookup[data-output-element-id*="campaign"] a span'
    ],
    secondary: [
      'span[title*="Campaign"] a span'
    ],
    fallback: null
  },

  expectedRevenue: {
    primary: [
      'records-record-layout-item[field-label*="Expected Revenue"] lightning-formatted-number',
      'lightning-formatted-number[data-output-element-id*="expectedrevenue"]'
    ],
    secondary: [
      'span[title*="Expected Revenue"] + span'
    ],
    fallback: null
  },

  lastActivityDate: {
    primary: [
      'records-record-layout-item[field-label*="Last Activity"] lightning-formatted-text',
      'lightning-formatted-text[data-output-element-id*="lastactivity"]'
    ],
    secondary: [
      'span[title*="Last Activity"] + span'
    ],
    fallback: null
  },

  fiscalQuarter: {
    primary: [
      'records-record-layout-item[field-label*="Fiscal"] lightning-formatted-text',
      'lightning-formatted-text[data-output-element-id*="fiscal"]'
    ],
    secondary: [
      'span[title*="Fiscal"] + span'
    ],
    fallback: null
  }
};

/**
 * Salesforce Account Page Selectors
 */
const SALESFORCE_ACCOUNT_SELECTORS = {
  accountName: {
    primary: [
      'records-record-layout-item[field-label*="Account Name"] lightning-formatted-text',
      '.slds-page-header__title',
      'h1.pageType'
    ],
    secondary: [
      'span.uiOutputText[data-aura-rendered-by]',
      'h1 span:not([class])'
    ],
    fallback: {
      strategy: 'scan-headings',
      pattern: /^(?!Home|Lightning|Sales|Setup).{3,}/
    }
  },

  industry: {
    primary: [
      'records-record-layout-item[field-label*="Industry"] lightning-formatted-text',
      'lightning-formatted-text[data-output-element-id*="industry"]'
    ],
    secondary: [
      'span[title*="Industry"] + span'
    ],
    fallback: {
      strategy: 'scan-nearby-label',
      label: 'Industry'
    }
  },

  annualRevenue: {
    primary: [
      'records-record-layout-item[field-label*="Annual Revenue"] lightning-formatted-number',
      'lightning-formatted-number[data-output-element-id*="annualrevenue"]'
    ],
    secondary: [
      'span[title*="Annual Revenue"] + span',
      '.uiOutputCurrency'
    ],
    fallback: null
  },

  employees: {
    primary: [
      'records-record-layout-item[field-label*="Employees"] lightning-formatted-number',
      'lightning-formatted-number[data-output-element-id*="employees"]'
    ],
    secondary: [
      'span[title*="Employees"] + span',
      '.uiOutputNumber'
    ],
    fallback: null
  },

  website: {
    primary: [
      'records-record-layout-item[field-label*="Website"] lightning-formatted-url a',
      'lightning-formatted-url[data-output-element-id*="website"] a'
    ],
    secondary: [
      'span[title*="Website"] a'
    ],
    fallback: null
  },

  billingAddress: {
    primary: [
      'records-record-layout-item[field-label*="Billing Address"] lightning-formatted-address',
      'lightning-formatted-address[data-output-element-id*="billing"]'
    ],
    secondary: [
      'span[title*="Billing Address"] + div'
    ],
    fallback: null
  }
};

/**
 * Salesforce Contact Page Selectors
 */
const SALESFORCE_CONTACT_SELECTORS = {
  contactName: {
    primary: [
      'records-record-layout-item[field-label*="Name"] lightning-formatted-text',
      '.slds-page-header__title',
      'h1.pageType'
    ],
    secondary: [
      'span.uiOutputText[data-aura-rendered-by]'
    ],
    fallback: {
      strategy: 'scan-headings',
      pattern: /^[A-Z][a-z]+ [A-Z][a-z]+/
    }
  },

  title: {
    primary: [
      'records-record-layout-item[field-label*="Title"] lightning-formatted-text',
      'lightning-formatted-text[data-output-element-id*="title"]'
    ],
    secondary: [
      'span[title*="Title"] + span'
    ],
    fallback: null
  },

  accountName: {
    primary: [
      'records-record-layout-item[field-label*="Account Name"] lightning-formatted-lookup a span',
      'lightning-formatted-lookup[data-output-element-id*="account"] a span'
    ],
    secondary: [
      'span[title*="Account"] a span'
    ],
    fallback: null
  },

  email: {
    primary: [
      'records-record-layout-item[field-label*="Email"] lightning-formatted-email a',
      'lightning-formatted-email[data-output-element-id*="email"] a'
    ],
    secondary: [
      'span[title*="Email"] a[href^="mailto:"]'
    ],
    fallback: {
      strategy: 'scan-email',
      pattern: /[\w.-]+@[\w.-]+\.\w+/
    }
  },

  phone: {
    primary: [
      'records-record-layout-item[field-label*="Phone"] lightning-formatted-phone a',
      'lightning-formatted-phone[data-output-element-id*="phone"] a'
    ],
    secondary: [
      'span[title*="Phone"] a[href^="tel:"]'
    ],
    fallback: {
      strategy: 'scan-phone',
      pattern: /\(?[\d]{3}\)?[-.\s]?[\d]{3}[-.\s]?[\d]{4}/
    }
  }
};

/**
 * Get Salesforce selector map for a given page type
 *
 * @param {string} pageType - Salesforce page type (opportunity, account, contact)
 * @returns {Object|null} Selector map or null if not found
 */
function getSalesforceSelectorMap(pageType) {
  const selectorMaps = {
    opportunity: SALESFORCE_OPPORTUNITY_SELECTORS,
    account: SALESFORCE_ACCOUNT_SELECTORS,
    contact: SALESFORCE_CONTACT_SELECTORS
  };

  return selectorMaps[pageType] || null;
}

/**
 * Get list of required fields for a given Salesforce page type
 *
 * @param {string} pageType - Salesforce page type
 * @returns {Array<string>} Array of required field names
 */
function getSalesforceRequiredFields(pageType) {
  const requiredFields = {
    opportunity: ['opportunityName', 'stage', 'closeDate'],
    account: ['accountName'],
    contact: ['contactName']
  };

  return requiredFields[pageType] || [];
}

// Export for use in content scripts
if (typeof window !== 'undefined') {
  window.RubiSalesforceSelectorMap = {
    getSalesforceSelectorMap,
    getSalesforceRequiredFields
  };
}