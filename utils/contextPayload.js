/**
 * Rubi Browser Extension - Context Payload Builder
 *
 * Builds normalized Rubi Context Payload from extractor results.
 * Standardizes data format across all platforms (LinkedIn, Salesforce, etc.).
 */

/**
 * Build normalized Rubi Context Payload from extractor result
 *
 * @param {Object} extractorResult - Result from linkedinExtractor or salesforceExtractor
 * @param {Object} options - Options for payload building
 * @param {number} options.maxVisibleTextLength - Maximum length for visibleText (default 5000)
 * @returns {Object} Normalized Rubi Context Payload
 */
function buildRubiContextPayload(extractorResult, options = {}) {
  const { maxVisibleTextLength = 5000 } = options;

  // Safely get window.location.href and document.title
  let url = '';
  let title = '';
  
  try {
    url = typeof window !== 'undefined' && window.location ? window.location.href : '';
  } catch (e) {
    url = '';
  }

  try {
    title = typeof document !== 'undefined' && document.title ? document.title : '';
  } catch (e) {
    title = '';
  }

  // Truncate visible text if needed
  let visibleText = '';
  if (extractorResult && typeof extractorResult.visibleText === 'string') {
    visibleText = extractorResult.visibleText;
    if (visibleText.length > maxVisibleTextLength) {
      visibleText = visibleText.substring(0, maxVisibleTextLength);
    }
  }

  // Build normalized payload
  const payload = {
    source: "browser_extension",
    platform: extractorResult && extractorResult.platform ? extractorResult.platform : "unknown",
    pageType: extractorResult && extractorResult.pageType ? extractorResult.pageType : "unknown",
    fields: extractorResult && extractorResult.fields ? extractorResult.fields : {},
    extractionConfidence: extractorResult && typeof extractorResult.extractionConfidence === "number" ? extractorResult.extractionConfidence : null,
    requiredMissing: extractorResult && Array.isArray(extractorResult.requiredMissing) ? extractorResult.requiredMissing : [],
    visibleText: visibleText,
    url: url,
    title: title,
    timestamp: new Date().toISOString()
  };

  return payload;
}

// Export for use in content scripts
if (typeof window !== 'undefined') {
  window.RubiContextPayload = {
    buildRubiContextPayload
  };
}