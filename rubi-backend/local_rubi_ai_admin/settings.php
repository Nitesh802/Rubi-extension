<?php
defined('MOODLE_INTERNAL') || die();

if ($hassiteconfig) {
    $settings = new admin_settingpage('local_rubi_ai_admin', get_string('pluginname', 'local_rubi_ai_admin'));
    
    $settings->add(new admin_setting_heading(
        'local_rubi_ai_admin/backend_heading',
        'Backend Integration',
        'Configure connection to Rubi backend service'
    ));
    
    $settings->add(new admin_setting_configtext(
        'local_rubi_ai_admin/backend_url',
        'Backend URL',
        'URL of the Rubi backend service',
        'http://localhost:3000',
        PARAM_URL
    ));
    
    $settings->add(new admin_setting_configpasswordunmask(
        'local_rubi_ai_admin/backend_api_token',
        'Backend API Token',
        'Shared secret for backend authentication',
        'TOKEN_GOES_HERE'
    ));
    
    $settings->add(new admin_setting_configpasswordunmask(
        'local_rubi_ai_admin/identity_jwt_secret',
        'Identity JWT Secret',
        'Secret for signing identity JWTs',
        'TOKEN_GOES_HERE'
    ));
    
    $settings->add(new admin_setting_heading(
        'local_rubi_ai_admin/org_heading',
        'Organization Settings',
        'Configure organization defaults'
    ));
    
    $settings->add(new admin_setting_configtext(
        'local_rubi_ai_admin/default_org_id',
        'Default Organization ID',
        'Default organization identifier',
        'default',
        PARAM_TEXT
    ));
    
    $settings->add(new admin_setting_configtext(
        'local_rubi_ai_admin/org_name',
        'Organization Name',
        'Display name for the organization',
        'Default Organization',
        PARAM_TEXT
    ));
    
    $settings->add(new admin_setting_configcheckbox(
        'local_rubi_ai_admin/enabled',
        'Enable Rubi AI for this organization',
        'Main toggle for all Rubi AI features',
        1
    ));
    
    $settings->add(new admin_setting_configcheckbox(
        'local_rubi_ai_admin/browser_extension_enabled',
        'Enable Rubi Browser Extension experiences',
        'Allow browser extension to execute AI actions',
        1
    ));
    
    $settings->add(new admin_setting_configtext(
        'local_rubi_ai_admin/max_daily_actions_per_org',
        'Max daily AI actions (per org)',
        'Leave empty for unlimited',
        '',
        PARAM_INT
    ));
    
    $settings->add(new admin_setting_configtext(
        'local_rubi_ai_admin/max_daily_actions_per_user',
        'Max daily AI actions (per user)',
        'Leave empty for unlimited',
        '',
        PARAM_INT
    ));
    
    $settings->add(new admin_setting_configtextarea(
        'local_rubi_ai_admin/allowed_domains',
        'Allowed domains for browser extension AI',
        'One domain per line (e.g. linkedin.com). Leave empty to allow all domains.',
        '',
        PARAM_TEXT
    ));
    
    $settings->add(new admin_setting_heading(
        'local_rubi_ai_admin/llm_heading',
        'LLM Provider Settings',
        'Configure language model preferences'
    ));
    
    $settings->add(new admin_setting_configselect(
        'local_rubi_ai_admin/llm_provider',
        'LLM Provider',
        'Primary language model provider',
        'openai',
        ['openai' => 'OpenAI', 'anthropic' => 'Anthropic', 'google' => 'Google']
    ));
    
    $settings->add(new admin_setting_configtext(
        'local_rubi_ai_admin/llm_model',
        'LLM Model',
        'Specific model to use',
        'gpt-4o',
        PARAM_TEXT
    ));
    
    $settings->add(new admin_setting_configtext(
        'local_rubi_ai_admin/temperature',
        'Temperature',
        'Model temperature (0.0 to 1.0)',
        '0.7',
        PARAM_FLOAT
    ));
    
    $settings->add(new admin_setting_configtext(
        'local_rubi_ai_admin/max_tokens',
        'Max Tokens',
        'Maximum tokens for responses',
        '4000',
        PARAM_INT
    ));
    
    $settings->add(new admin_setting_heading(
        'local_rubi_ai_admin/features_heading',
        'Feature Flags',
        'Enable or disable specific features'
    ));
    
    $settings->add(new admin_setting_configcheckbox(
        'local_rubi_ai_admin/feature_context_extraction',
        'Context Extraction',
        'Enable automatic context extraction',
        1
    ));
    
    $settings->add(new admin_setting_configcheckbox(
        'local_rubi_ai_admin/feature_action_suggestions',
        'Action Suggestions',
        'Enable AI action suggestions',
        1
    ));
    
    $settings->add(new admin_setting_configcheckbox(
        'local_rubi_ai_admin/feature_learning_mode',
        'Learning Mode',
        'Enable learning from user interactions',
        0
    ));
    
    $settings->add(new admin_setting_configcheckbox(
        'local_rubi_ai_admin/feature_debug_mode',
        'Debug Mode',
        'Enable debug information in responses',
        0
    ));
    
    $settings->add(new admin_setting_heading(
        'local_rubi_ai_admin/prompts_heading',
        'Custom Prompts',
        'Customize AI behavior with custom prompts'
    ));
    
    $settings->add(new admin_setting_configtextarea(
        'local_rubi_ai_admin/custom_system_prompt',
        'System Prompt',
        'Custom system prompt for AI',
        '',
        PARAM_TEXT
    ));
    
    $settings->add(new admin_setting_configtextarea(
        'local_rubi_ai_admin/custom_context_prefix',
        'Context Prefix',
        'Prefix added to all context',
        '',
        PARAM_TEXT
    ));
    
    $settings->add(new admin_setting_heading(
        'local_rubi_ai_admin/webhooks_heading',
        'Webhooks',
        'Configure webhook endpoints'
    ));
    
    $settings->add(new admin_setting_configtext(
        'local_rubi_ai_admin/webhook_on_action_complete',
        'On Action Complete',
        'Webhook called when action completes',
        '',
        PARAM_URL
    ));
    
    $settings->add(new admin_setting_configtext(
        'local_rubi_ai_admin/webhook_on_error',
        'On Error',
        'Webhook called on errors',
        '',
        PARAM_URL
    ));
    
    $ADMIN->add('localplugins', $settings);
}