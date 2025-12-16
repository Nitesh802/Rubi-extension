/**
 * Rubi Browser Extension - LinkedIn Extractor
 *
 * LinkedIn-specific context extraction using DOM heuristics and polling.
 * Follows the Salesforce extractor architecture pattern.
 */

/**
 * Extract LinkedIn context based on page type
 *
 * @param {string} pageType - LinkedIn page type (profile, company, job, search, feed, messaging)
 * @returns {Promise<Object>} Extracted context object
 */
async function extractLinkedInContext(pageType) {
  console.log(`[Rubi LinkedIn Extractor] Starting extraction for page type: ${pageType}`);

  // Wait for LinkedIn DOM to be ready
  await waitForLinkedInDOMReady(pageType);

  // Route to page-specific extractor
  switch (pageType) {
    case 'profile':
      return await extractLinkedInProfile();
    case 'company':
      return await extractLinkedInCompany();
    case 'job':
      return await extractLinkedInJob();
    case 'search':
      return await extractLinkedInSearch();
    case 'feed':
      return extractLinkedInFeed();
    case 'messaging':
      return extractLinkedInMessaging();
    default:
      return extractLinkedInUnknown();
  }
}

/**
 * Wait for LinkedIn DOM to hydrate
 *
 * @param {string} pageType - LinkedIn page type
 * @returns {Promise<boolean>} True if ready, false if timeout
 */
async function waitForLinkedInDOMReady(pageType) {
  const MAX_POLLS = 20;
  const POLL_INTERVAL = 300;

  const selectors = {
    profile: 'main h1.text-heading-xlarge, main section, .pv-text-details__left-panel',
    company: '.org-top-card, [data-control-name="org_home"]',
    job: '.jobs-unified-top-card, [data-job-id]',
    search: '.search-results-container, [data-test-search-results-container]',
    feed: '.feed-shared-update-v2, [data-id^="urn:li:activity"]',
    messaging: '.msg-overlay-list-bubble, [data-control-name="msg_overlay"]'
  };

  const targetSelector = selectors[pageType] || 'main';

  for (let attempt = 1; attempt <= MAX_POLLS; attempt++) {
    const element = document.querySelector(targetSelector);
    if (element) {
      console.log(`[Rubi LinkedIn Extractor] DOM ready after ${attempt} poll(s)`);
      
      // For profile pages, wait a bit more for sections to load
      if (pageType === 'profile') {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      return true;
    }

    if (attempt < MAX_POLLS) {
      await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
    }
  }

  console.warn('[Rubi LinkedIn Extractor] DOM not ready after polling');
  return false;
}

/**
 * Trigger LinkedIn sections to load by scrolling
 * LinkedIn lazy-loads sections as you scroll
 */
async function triggerSectionLoading() {
  // Check if we're on a profile page with sections
  const mainElement = document.querySelector('main');
  if (!mainElement) return;
  
  // Scroll to trigger lazy loading of sections
  const sections = ['experience', 'education', 'skills', 'about'];
  
  for (const sectionName of sections) {
    // Try to find the section anchor
    const sectionAnchor = document.querySelector(`#${sectionName}`) || 
                          document.querySelector(`[id*="${sectionName}"]`);
    
    if (sectionAnchor) {
      // Scroll the section into view
      sectionAnchor.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Wait for content to load
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }
  
  // Scroll back to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
  
  // Wait for any final loading
  await new Promise(resolve => setTimeout(resolve, 500));
}

/**
 * Extract LinkedIn profile context
 *
 * @returns {Promise<Object>} Extracted profile context
 */
async function extractLinkedInProfile() {
  console.log('[Rubi LinkedIn Extractor] Extracting profile data');
  
  // Trigger section loading by scrolling
  await triggerSectionLoading();

  const fields = {
    fullName: null,
    headline: null,
    location: null,
    about: null,
    experience: [],
    education: [],
    skills: []
  };

  // Extract full name
  const nameElement =
    document.querySelector('main h1.text-heading-xlarge') ||
    document.querySelector('.pv-text-details__left-panel h1') ||
    document.querySelector('main h1');

  if (nameElement) {
    fields.fullName = nameElement.textContent.trim();
    console.log(`[Rubi LinkedIn Extractor] fullName: ${fields.fullName}`);
  }

  // Extract headline
  const headlineElement =
    document.querySelector('div.text-body-medium.break-words') ||
    document.querySelector('.pv-text-details__left-panel .text-body-medium');

  if (headlineElement) {
    fields.headline = headlineElement.textContent.trim();
    console.log(`[Rubi LinkedIn Extractor] headline: ${fields.headline}`);
  }

  // Extract location
  const locationElement =
    document.querySelector('span.text-body-small.inline.t-black--light.break-words') ||
    document.querySelector('.pv-text-details__left-panel .text-body-small');

  if (locationElement) {
    fields.location = locationElement.textContent.trim();
    console.log(`[Rubi LinkedIn Extractor] location: ${fields.location}`);
  }

  // Extract about section
  const aboutElement = 
    document.querySelector('section:has(#about) + div span[aria-hidden="true"]') ||
    document.querySelector('[data-view-name="profile-card"] span[aria-hidden="true"]') ||
    document.querySelector('section div.display-flex.full-width span[aria-hidden="true"]');
  
  if (aboutElement) {
    fields.about = aboutElement.textContent.trim();
    console.log(`[Rubi LinkedIn Extractor] about: ${fields.about.substring(0, 50)}...`);
  }

  // Extract experience
  fields.experience = extractExperienceSection();
  console.log(`[Rubi LinkedIn Extractor] experience: ${fields.experience.length} entries`);

  // Extract education
  fields.education = extractEducationSection();
  console.log(`[Rubi LinkedIn Extractor] education: ${fields.education.length} entries`);

  // Extract skills
  fields.skills = extractSkillsSection();
  console.log(`[Rubi LinkedIn Extractor] skills: ${fields.skills.length} entries`);

  // Calculate confidence
  const totalFields = 7;
  let extractedCount = 0;
  if (fields.fullName) extractedCount++;
  if (fields.headline) extractedCount++;
  if (fields.location) extractedCount++;
  if (fields.about) extractedCount++;
  if (fields.experience.length > 0) extractedCount++;
  if (fields.education.length > 0) extractedCount++;
  if (fields.skills.length > 0) extractedCount++;

  const confidence = Math.round((extractedCount / totalFields) * 100);

  const missingFields = [];
  if (!fields.fullName) missingFields.push('fullName');
  if (!fields.headline) missingFields.push('headline');
  if (!fields.location) missingFields.push('location');
  if (!fields.about) missingFields.push('about');
  if (fields.experience.length === 0) missingFields.push('experience');
  if (fields.education.length === 0) missingFields.push('education');
  if (fields.skills.length === 0) missingFields.push('skills');

  const visibleText = extractVisibleText();

  const context = {
    platform: 'linkedin',
    pageType: 'profile',
    fields,
    visibleText,
    extractionConfidence: confidence,
    missingFields,
    timestamp: new Date().toISOString(),
    url: window.location.href
  };

  if (confidence < 30) {
    console.warn('[Rubi LinkedIn Extractor] Low profile extraction confidence. User may need to scroll to load sections.');
  }

  console.log(`[Rubi LinkedIn Extractor] Profile extraction complete: ${extractedCount}/${totalFields} fields (${confidence}% confidence)`);

  return context;
}

/**
 * Extract LinkedIn company context
 *
 * @returns {Promise<Object>} Extracted company context
 */
async function extractLinkedInCompany() {
  console.log('[Rubi LinkedIn Extractor] Extracting company data');

  const fields = {
    companyName: null,
    industry: null,
    size: null,
    website: null,
    headquarters: null,
    about: null,
    specialties: null
  };

  // Extract company name
  const companyNameElement =
    document.querySelector('.org-top-card-summary__title') ||
    document.querySelector('h1.org-top-card-summary__title') ||
    document.querySelector('main h1');

  if (companyNameElement) {
    fields.companyName = companyNameElement.textContent.trim();
    console.log(`[Rubi LinkedIn Extractor] companyName: ${fields.companyName}`);
  }

  // Extract industry
  const industryElement = findLabeledValue('industry');
  if (industryElement) {
    fields.industry = industryElement;
    console.log(`[Rubi LinkedIn Extractor] industry: ${fields.industry}`);
  }

  // Extract company size
  const sizeElement = findLabeledValue('company size', 'size');
  if (sizeElement) {
    fields.size = sizeElement;
    console.log(`[Rubi LinkedIn Extractor] size: ${fields.size}`);
  }

  // Extract website
  const websiteElement =
    document.querySelector('.org-top-card-primary-actions__inner a[href*="http"]') ||
    document.querySelector('.org-about-us-organization-description__website a');

  if (websiteElement) {
    fields.website = websiteElement.href;
    console.log(`[Rubi LinkedIn Extractor] website: ${fields.website}`);
  }

  // Extract headquarters
  const hqElement = findLabeledValue('headquarters', 'locations');
  if (hqElement) {
    fields.headquarters = hqElement;
    console.log(`[Rubi LinkedIn Extractor] headquarters: ${fields.headquarters}`);
  }

  // Extract about section
  const aboutSection = findSectionContent('about', 'overview');
  if (aboutSection) {
    fields.about = aboutSection;
    console.log(`[Rubi LinkedIn Extractor] about: ${fields.about.substring(0, 50)}...`);
  }

  // Extract specialties
  const specialtiesElement = findLabeledValue('specialties');
  if (specialtiesElement) {
    fields.specialties = specialtiesElement;
    console.log(`[Rubi LinkedIn Extractor] specialties: ${fields.specialties}`);
  }

  // Calculate confidence
  const totalFields = 7;
  let extractedCount = 0;
  if (fields.companyName) extractedCount++;
  if (fields.industry) extractedCount++;
  if (fields.size) extractedCount++;
  if (fields.website) extractedCount++;
  if (fields.headquarters) extractedCount++;
  if (fields.about) extractedCount++;
  if (fields.specialties) extractedCount++;

  const confidence = Math.round((extractedCount / totalFields) * 100);

  const missingFields = [];
  if (!fields.companyName) missingFields.push('companyName');
  if (!fields.industry) missingFields.push('industry');
  if (!fields.size) missingFields.push('size');
  if (!fields.website) missingFields.push('website');
  if (!fields.headquarters) missingFields.push('headquarters');
  if (!fields.about) missingFields.push('about');
  if (!fields.specialties) missingFields.push('specialties');

  const visibleText = extractVisibleText();

  const context = {
    platform: 'linkedin',
    pageType: 'company',
    fields,
    visibleText,
    extractionConfidence: confidence,
    missingFields,
    timestamp: new Date().toISOString(),
    url: window.location.href
  };

  console.log(`[Rubi LinkedIn Extractor] Company extraction complete: ${extractedCount}/${totalFields} fields (${confidence}% confidence)`);

  return context;
}

/**
 * Extract LinkedIn job context
 *
 * @returns {Promise<Object>} Extracted job context
 */
async function extractLinkedInJob() {
  console.log('[Rubi LinkedIn Extractor] Extracting job data');

  const fields = {
    jobTitle: null,
    companyName: null,
    location: null,
    seniority: null,
    jobType: null,
    postedDate: null,
    description: null
  };

  // Extract job title
  const jobTitleElement =
    document.querySelector('.jobs-unified-top-card__job-title') ||
    document.querySelector('h1.t-24') ||
    document.querySelector('.job-details-jobs-unified-top-card__job-title h1');

  if (jobTitleElement) {
    fields.jobTitle = jobTitleElement.textContent.trim();
    console.log(`[Rubi LinkedIn Extractor] jobTitle: ${fields.jobTitle}`);
  }

  // Extract company name
  const companyNameElement =
    document.querySelector('.jobs-unified-top-card__company-name a') ||
    document.querySelector('.job-details-jobs-unified-top-card__company-name a');

  if (companyNameElement) {
    fields.companyName = companyNameElement.textContent.trim();
    console.log(`[Rubi LinkedIn Extractor] companyName: ${fields.companyName}`);
  }

  // Extract location
  const locationElement =
    document.querySelector('.jobs-unified-top-card__bullet') ||
    document.querySelector('.job-details-jobs-unified-top-card__primary-description-container .t-black--light');

  if (locationElement) {
    fields.location = locationElement.textContent.trim();
    console.log(`[Rubi LinkedIn Extractor] location: ${fields.location}`);
  }

  // Extract seniority level
  const seniorityElement = findJobDetailItem('seniority level');
  if (seniorityElement) {
    fields.seniority = seniorityElement;
    console.log(`[Rubi LinkedIn Extractor] seniority: ${fields.seniority}`);
  }

  // Extract job type
  const jobTypeElement = findJobDetailItem('employment type', 'job type');
  if (jobTypeElement) {
    fields.jobType = jobTypeElement;
    console.log(`[Rubi LinkedIn Extractor] jobType: ${fields.jobType}`);
  }

  // Extract posted date
  const postedDateElement =
    document.querySelector('.jobs-unified-top-card__posted-date') ||
    document.querySelector('.job-details-jobs-unified-top-card__primary-description-container time');

  if (postedDateElement) {
    fields.postedDate = postedDateElement.textContent.trim();
    console.log(`[Rubi LinkedIn Extractor] postedDate: ${fields.postedDate}`);
  }

  // Extract description
  const descriptionElement =
    document.querySelector('.jobs-description__content') ||
    document.querySelector('.jobs-box__html-content');

  if (descriptionElement) {
    fields.description = descriptionElement.textContent.trim();
    console.log(`[Rubi LinkedIn Extractor] description: ${fields.description.substring(0, 50)}...`);
  }

  // Calculate confidence
  const totalFields = 7;
  let extractedCount = 0;
  if (fields.jobTitle) extractedCount++;
  if (fields.companyName) extractedCount++;
  if (fields.location) extractedCount++;
  if (fields.seniority) extractedCount++;
  if (fields.jobType) extractedCount++;
  if (fields.postedDate) extractedCount++;
  if (fields.description) extractedCount++;

  const confidence = Math.round((extractedCount / totalFields) * 100);

  const missingFields = [];
  if (!fields.jobTitle) missingFields.push('jobTitle');
  if (!fields.companyName) missingFields.push('companyName');
  if (!fields.location) missingFields.push('location');
  if (!fields.seniority) missingFields.push('seniority');
  if (!fields.jobType) missingFields.push('jobType');
  if (!fields.postedDate) missingFields.push('postedDate');
  if (!fields.description) missingFields.push('description');

  const visibleText = extractVisibleText();

  const context = {
    platform: 'linkedin',
    pageType: 'job',
    fields,
    visibleText,
    extractionConfidence: confidence,
    missingFields,
    timestamp: new Date().toISOString(),
    url: window.location.href
  };

  console.log(`[Rubi LinkedIn Extractor] Job extraction complete: ${extractedCount}/${totalFields} fields (${confidence}% confidence)`);

  return context;
}

/**
 * Extract LinkedIn search context
 *
 * @returns {Promise<Object>} Extracted search context
 */
async function extractLinkedInSearch() {
  console.log('[Rubi LinkedIn Extractor] Extracting search results');

  const fields = {
    topPeople: [],
    topCompanies: [],
    topJobs: []
  };

  // Extract top people
  const peopleElements = document.querySelectorAll('.search-results__list .entity-result__title-text a, .reusable-search__result-container .entity-result__title-text a');
  for (let i = 0; i < Math.min(5, peopleElements.length); i++) {
    const name = peopleElements[i].textContent.trim();
    const url = peopleElements[i].href;
    if (url.includes('/in/')) {
      fields.topPeople.push({ name, url });
    }
  }
  console.log(`[Rubi LinkedIn Extractor] topPeople: ${fields.topPeople.length} entries`);

  // Extract top companies
  const companyElements = document.querySelectorAll('.search-results__list .entity-result__title-text a, .reusable-search__result-container .entity-result__title-text a');
  for (let i = 0; i < Math.min(5, companyElements.length); i++) {
    const name = companyElements[i].textContent.trim();
    const url = companyElements[i].href;
    if (url.includes('/company/')) {
      fields.topCompanies.push({ name, url });
    }
  }
  console.log(`[Rubi LinkedIn Extractor] topCompanies: ${fields.topCompanies.length} entries`);

  // Extract top jobs
  const jobElements = document.querySelectorAll('.job-card-container__link, .jobs-search-results__list-item a');
  for (let i = 0; i < Math.min(5, jobElements.length); i++) {
    const title = jobElements[i].textContent.trim();
    const url = jobElements[i].href;
    if (url.includes('/jobs/view/')) {
      fields.topJobs.push({ title, url });
    }
  }
  console.log(`[Rubi LinkedIn Extractor] topJobs: ${fields.topJobs.length} entries`);

  // Calculate confidence
  const totalFields = 3;
  let extractedCount = 0;
  if (fields.topPeople.length > 0) extractedCount++;
  if (fields.topCompanies.length > 0) extractedCount++;
  if (fields.topJobs.length > 0) extractedCount++;

  const confidence = Math.round((extractedCount / totalFields) * 100);

  const missingFields = [];
  if (fields.topPeople.length === 0) missingFields.push('topPeople');
  if (fields.topCompanies.length === 0) missingFields.push('topCompanies');
  if (fields.topJobs.length === 0) missingFields.push('topJobs');

  const visibleText = extractVisibleText();

  const context = {
    platform: 'linkedin',
    pageType: 'search',
    fields,
    visibleText,
    extractionConfidence: confidence,
    missingFields,
    timestamp: new Date().toISOString(),
    url: window.location.href
  };

  console.log(`[Rubi LinkedIn Extractor] Search extraction complete: ${extractedCount}/${totalFields} fields (${confidence}% confidence)`);

  return context;
}

/**
 * Extract LinkedIn feed context (not supported)
 *
 * @returns {Object} Empty context with guidance message
 */
function extractLinkedInFeed() {
  console.log('[Rubi LinkedIn Extractor] LinkedIn feed pages do not support structured extraction');

  const visibleText = extractVisibleText();

  return {
    platform: 'linkedin',
    pageType: 'feed',
    fields: {},
    visibleText,
    extractionConfidence: 0,
    missingFields: [],
    guidanceMessage: 'LinkedIn feed and messaging pages do not contain structured extractable data.',
    timestamp: new Date().toISOString(),
    url: window.location.href
  };
}

/**
 * Extract LinkedIn messaging context (not supported)
 *
 * @returns {Object} Empty context with guidance message
 */
function extractLinkedInMessaging() {
  console.log('[Rubi LinkedIn Extractor] LinkedIn messaging pages do not support structured extraction');

  const visibleText = extractVisibleText();

  return {
    platform: 'linkedin',
    pageType: 'messaging',
    fields: {},
    visibleText,
    extractionConfidence: 0,
    missingFields: [],
    guidanceMessage: 'LinkedIn feed and messaging pages do not contain structured extractable data.',
    timestamp: new Date().toISOString(),
    url: window.location.href
  };
}

/**
 * Extract LinkedIn unknown page context
 *
 * @returns {Object} Empty context
 */
function extractLinkedInUnknown() {
  console.log('[Rubi LinkedIn Extractor] Unknown LinkedIn page type');

  const visibleText = extractVisibleText();

  return {
    platform: 'linkedin',
    pageType: 'unknown',
    fields: {},
    visibleText,
    extractionConfidence: 0,
    missingFields: [],
    timestamp: new Date().toISOString(),
    url: window.location.href
  };
}

/**
 * Helper: Find section content by section ID or keyword
 *
 * @param {...string} keywords - Section keywords to search for
 * @returns {string|null} Section content or null
 */
function findSectionContent(...keywords) {
  for (const keyword of keywords) {
    const sectionElement =
      document.querySelector(`section[data-section="${keyword}"]`) ||
      document.querySelector(`section#${keyword}`) ||
      document.getElementById(keyword);

    if (sectionElement) {
      const contentElement =
        sectionElement.querySelector('.inline-show-more-text') ||
        sectionElement.querySelector('.pv-shared-text-with-see-more') ||
        sectionElement.querySelector('span[aria-hidden="true"]') ||
        sectionElement;

      if (contentElement) {
        return contentElement.textContent.trim();
      }
    }
  }

  return null;
}

/**
 * Helper: Find labeled value by label text
 *
 * @param {...string} labels - Label keywords to search for
 * @returns {string|null} Value or null
 */
function findLabeledValue(...labels) {
  const textBlocks = collectTextBlocks();

  for (let i = 0; i < textBlocks.length - 1; i++) {
    const text = textBlocks[i].toLowerCase();
    for (const label of labels) {
      if (text.includes(label.toLowerCase())) {
        const nextText = textBlocks[i + 1];
        if (nextText && nextText.length > 0 && nextText.length < 200) {
          return nextText;
        }
      }
    }
  }

  return null;
}

/**
 * Helper: Find job detail item by label
 *
 * @param {...string} labels - Label keywords to search for
 * @returns {string|null} Value or null
 */
function findJobDetailItem(...labels) {
  const detailElements = document.querySelectorAll('.jobs-unified-top-card__job-insight, .job-details-jobs-unified-top-card__job-insight');

  for (const element of detailElements) {
    const text = element.textContent.toLowerCase();
    for (const label of labels) {
      if (text.includes(label.toLowerCase())) {
        return element.textContent.trim();
      }
    }
  }

  return findLabeledValue(...labels);
}

/**
 * Helper: Extract experience section entries
 *
 * @returns {Array<Object>} Array of experience objects
 */
function extractExperienceSection() {
  const experiences = [];
  
  // Try multiple selectors for experience section
  const experienceSection =
    document.querySelector('section:has(#experience)') ||
    document.querySelector('section[id*="experience"]') ||
    document.querySelector('div[id="experience"]')?.closest('section') ||
    Array.from(document.querySelectorAll('section')).find(s => 
      s.querySelector('div[id="experience"]'));

  if (!experienceSection) {
    return experiences;
  }

  // LinkedIn's current structure uses these classes
  const experienceItems = experienceSection.querySelectorAll(
    'li.artdeco-list__item, li[class*="pvs-list__paged-list-item"], div.pvs-entity'
  );

  for (let i = 0; i < Math.min(5, experienceItems.length); i++) {
    const item = experienceItems[i];
    
    // Get all visible text spans
    const textSpans = item.querySelectorAll('span[aria-hidden="true"], span.visually-hidden');
    
    if (textSpans.length >= 1) {
      const title = textSpans[0]?.textContent?.trim();
      const company = textSpans[1]?.textContent?.trim() || 
                     item.querySelector('.t-14, .t-normal')?.textContent?.trim();
      
      if (title && !title.includes('logo')) {
        experiences.push({
          title: title,
          company: company
        });
      }
    }
  }

  return experiences;
}

/**
 * Helper: Extract education section entries
 *
 * @returns {Array<Object>} Array of education objects
 */
function extractEducationSection() {
  const education = [];
  
  // Try multiple selectors for education section
  const educationSection =
    document.querySelector('section:has(#education)') ||
    document.querySelector('section[id*="education"]') ||
    document.querySelector('div[id="education"]')?.closest('section') ||
    Array.from(document.querySelectorAll('section')).find(s => 
      s.querySelector('div[id="education"]'));

  if (!educationSection) {
    return education;
  }

  // LinkedIn's current structure uses these classes
  const educationItems = educationSection.querySelectorAll(
    'li.artdeco-list__item, li[class*="pvs-list__paged-list-item"], div.pvs-entity'
  );

  for (let i = 0; i < Math.min(5, educationItems.length); i++) {
    const item = educationItems[i];
    
    // Get all visible text spans
    const textSpans = item.querySelectorAll('span[aria-hidden="true"], span.visually-hidden');
    
    if (textSpans.length >= 1) {
      const school = textSpans[0]?.textContent?.trim();
      const degree = textSpans[1]?.textContent?.trim() || 
                    item.querySelector('.t-14, .t-normal')?.textContent?.trim();
      
      if (school && !school.includes('logo')) {
        education.push({
          school: school,
          degree: degree
        });
      }
    }
  }

  return education;
}

/**
 * Helper: Extract skills section entries
 *
 * @returns {Array<string>} Array of skill names
 */
function extractSkillsSection() {
  const skills = [];
  
  // Try multiple selectors for skills section
  const skillsSection =
    document.querySelector('section:has(#skills)') ||
    document.querySelector('section[id*="skills"]') ||
    document.querySelector('div[id="skills"]')?.closest('section') ||
    Array.from(document.querySelectorAll('section')).find(s => 
      s.querySelector('div[id="skills"]'));

  if (!skillsSection) {
    return skills;
  }

  // Get skill items - LinkedIn uses various structures
  const skillItems = skillsSection.querySelectorAll(
    'li.artdeco-list__item span[aria-hidden="true"], ' +
    'li[class*="pvs-list"] span[aria-hidden="true"], ' +
    'div.pvs-entity span[aria-hidden="true"]'
  );

  for (let i = 0; i < Math.min(10, skillItems.length); i++) {
    const skill = skillItems[i].textContent.trim();
    // Filter out non-skill text like "skills", "endorsements", etc.
    if (skill && skill.length < 50 && !skill.toLowerCase().includes('skill') && 
        !skill.toLowerCase().includes('endorsement')) {
      skills.push(skill);
    }
  }

  return skills;
}

/**
 * Helper: Collect all text blocks from the page
 *
 * @returns {Array<string>} Array of text strings
 */
function collectTextBlocks() {
  const textBlocks = [];
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    null,
    false
  );

  let node;
  while (node = walker.nextNode()) {
    const text = node.textContent.trim();
    if (text.length > 0 && text.length < 500) {
      textBlocks.push(text);
    }
  }

  return textBlocks;
}

/**
 * Extract visible text from the page for LLM context
 *
 * @returns {string} Visible text content
 */
function extractVisibleText() {
  const textNodes = [];
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: function(node) {
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;

        const style = window.getComputedStyle(parent);
        if (style.display === 'none' || style.visibility === 'hidden') {
          return NodeFilter.FILTER_REJECT;
        }

        const text = node.textContent.trim();
        if (text.length === 0) {
          return NodeFilter.FILTER_REJECT;
        }

        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );

  let node;
  while (node = walker.nextNode()) {
    textNodes.push(node.textContent.trim());
  }

  let text = textNodes.join(' ');

  if (text.length > 5000) {
    text = text.substring(0, 5000) + '...';
  }

  return text;
}

// Export for use in content scripts
if (typeof window !== 'undefined') {
  window.RubiLinkedInExtractor = {
    extractLinkedInContext
  };
}
