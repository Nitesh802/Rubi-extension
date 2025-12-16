<?php
require_once(__DIR__ . '/../../../config.php');

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: X-API-Token, Authorization, Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$api_token = $_SERVER['HTTP_X_API_TOKEN'] ?? '';
$expected_token = get_config('local_rubi_ai_admin', 'backend_api_token');

if (empty($api_token) || $api_token !== $expected_token) {
    http_response_code(401);
    echo json_encode([
        'status' => 'error',
        'message' => 'Unauthorized'
    ]);
    exit();
}

$orgid = optional_param('orgid', '', PARAM_TEXT);

if (empty($orgid)) {
    $orgid = get_config('local_rubi_ai_admin', 'default_org_id');
}

$allowed_domains_raw = trim(get_config('local_rubi_ai_admin', 'allowed_domains') ?: '');
$allowed_domains = $allowed_domains_raw ? array_map('trim', explode("\n", $allowed_domains_raw)) : null;

$max_daily_org = get_config('local_rubi_ai_admin', 'max_daily_actions_per_org');
$max_daily_user = get_config('local_rubi_ai_admin', 'max_daily_actions_per_user');

$config = [
    'orgId' => $orgid,
    'orgName' => get_config('local_rubi_ai_admin', 'org_name') ?: 'Default Organization',
    'enabled' => get_config('local_rubi_ai_admin', 'enabled') !== '0',
    'browser_extension_enabled' => get_config('local_rubi_ai_admin', 'browser_extension_enabled') !== '0',
    'max_daily_actions_per_org' => $max_daily_org ? intval($max_daily_org) : null,
    'max_daily_actions_per_user' => $max_daily_user ? intval($max_daily_user) : null,
    'allowed_domains' => $allowed_domains,
    'llmProvider' => get_config('local_rubi_ai_admin', 'llm_provider') ?: 'openai',
    'llmModel' => get_config('local_rubi_ai_admin', 'llm_model') ?: 'gpt-4o',
    'temperature' => floatval(get_config('local_rubi_ai_admin', 'temperature') ?: 0.7),
    'maxTokens' => intval(get_config('local_rubi_ai_admin', 'max_tokens') ?: 4000),
    'features' => [
        'contextExtraction' => get_config('local_rubi_ai_admin', 'feature_context_extraction') !== '0',
        'actionSuggestions' => get_config('local_rubi_ai_admin', 'feature_action_suggestions') !== '0',
        'learningMode' => get_config('local_rubi_ai_admin', 'feature_learning_mode') === '1',
        'debugMode' => get_config('local_rubi_ai_admin', 'feature_debug_mode') === '1'
    ],
    'customPrompts' => [
        'systemPrompt' => get_config('local_rubi_ai_admin', 'custom_system_prompt') ?: '',
        'contextPrefix' => get_config('local_rubi_ai_admin', 'custom_context_prefix') ?: ''
    ],
    'webhooks' => [
        'onActionComplete' => get_config('local_rubi_ai_admin', 'webhook_on_action_complete') ?: '',
        'onError' => get_config('local_rubi_ai_admin', 'webhook_on_error') ?: ''
    ],
    'version' => get_config('local_rubi_ai_admin', 'version') ?: '1.0.0'
];

echo json_encode([
    'status' => 'success',
    'data' => $config,
    'timestamp' => date('c')
]);