const en = {
  app: { title: 'AirCapital' },

  home: {
    no_exchanges: {
      title: 'No Exchanges',
      description: 'Add the first exchange in Settings.',
    },
    open_settings: 'Open Settings',
  },

  exchange: {
    all_accounts: 'All Accounts',
    section: {
      total_balance: 'Total Balance',
      accounts: 'Accounts',
      structure: 'Structure',
    },
    no_exchanges: {
      title: 'No Exchanges',
      description: 'Add an exchange in Settings.',
    },
    structure: {
      empty: 'Not enough data to build structure yet',
      by_account: 'Top accounts',
    },
  },

  details: {
    section: {
      overview: 'Overview',
      balance: 'Balance',
      positions: 'Positions',
      wallets: 'Wallets',
    },
  },

  positions: {
    tab: { spot: 'Spot', futures: 'Futures' },
    empty: {
      title: 'No Open Positions',
      description: 'This wallet currently has no active positions.',
    },
    field: {
      opened: 'Opened:',
      quantity: 'Qty:',
      value: 'Value:',
    },
  },

  chart: { not_enough_data: 'Not enough data yet' },

  loading: {
    title: 'Calculating deposit',
    subtitle: 'Loading exchange balances and calculating the total',
  },

  settings: {
    title: 'Settings',
    header: {
      title: 'API Access',
      subtitle: 'Store exchange keys securely and keep balances in sync.',
    },
    language: {
      title: 'Language',
      label: 'App language',
      english: 'English',
      russian: 'Russian',
    },
    exchange: { title: 'Exchange', choose: 'Choose exchange' },
    account: {
      title: 'Account',
      name: 'Account Name',
      optional_label: 'Optional label',
    },
    api_keys: {
      title: 'API Keys',
      api_key: 'API Key',
      api_key_placeholder: 'Paste API key',
      secret_key: 'Secret Key',
      secret_key_placeholder: 'Paste secret key',
      passphrase: 'Passphrase',
      passphrase_placeholder: 'OKX passphrase',
      required: 'API Key and Secret Key are required.',
    },
    save_keys: 'Save Keys',
    saved_alert: { title: 'Saved' },
    saved_accounts: {
      title: 'Saved Accounts',
      empty: 'No saved accounts yet.',
    },
  },

  common: {
    ok: 'OK',
    error: 'Error',
    account_format: 'Account {{index}}',
    cancel: 'Cancel',
    delete: 'Delete',
    confirm_delete: 'Are you sure you want to delete this account?',
  },

  error: {
    too_many_requests: 'Too many requests',
    no_data: 'No data',
    decoding_error: 'Decoding error',
    waf_limit: 'WAF Limit (Web Application Firewall)',
    cancel_replace: 'cancelReplace order partially succeeded; the previous order may not have been cancelled while the new order may have been placed.',
    banned_ip: 'IP has been auto-banned for continuing to send requests after receiving 429 codes.',
    malformed_request: 'Malformed request; problem occurred on the sender\'s side.',
    exchange_side: 'The issue occurred on the exchange side.',
    unknown: 'Unknown error',
    incorrect_api_url: 'Incorrect API URL',
    invalid_api_keys_format: 'Invalid API keys for {{exchange}}',
  },

} as const;

export default en;
