const ru = {
  app: { title: 'AirCapital' },

  home: {
    no_exchanges: {
      title: 'Биржи не добавлены',
      description: 'Добавьте первую биржу в настройках.',
    },
    open_settings: 'Открыть настройки',
  },

  exchange: {
    all_accounts: 'Все аккаунты',
    section: {
      total_balance: 'Общий баланс',
      accounts: 'Аккаунты',
      structure: 'Структура',
    },
    no_exchanges: {
      title: 'Биржи не добавлены',
      description: 'Добавьте биржу в настройках.',
    },
    structure: {
      empty: 'Пока недостаточно данных для структуры',
      by_account: 'Топ аккаунтов',
    },
  },

  details: {
    section: {
      overview: 'Обзор',
      balance: 'Баланс',
      positions: 'Позиции',
      wallets: 'Кошельки',
    },
  },

  positions: {
    tab: { spot: 'Спот', futures: 'Фьючи' },
    empty: {
      title: 'Открытых позиций нет',
      description: 'В этом кошельке сейчас нет активных позиций.',
    },
    field: {
      opened: 'Открыта:',
      quantity: 'Кол-во:',
      value: 'Стоимость:',
    },
  },

  chart: { not_enough_data: 'Недостаточно данных' },

  loading: {
    title: 'Суммируем депозит',
    subtitle: 'Подгружаем балансы бирж и считаем итог',
  },

  settings: {
    title: 'Настройки',
    header: {
      title: 'Доступ к API',
      subtitle: 'Надёжно храните ключи бирж и синхронизируйте балансы.',
    },
    language: {
      title: 'Язык',
      label: 'Язык приложения',
      english: 'Английский',
      russian: 'Русский',
    },
    exchange: { title: 'Биржа', choose: 'Выберите биржу' },
    account: {
      title: 'Аккаунт',
      name: 'Название аккаунта',
      optional_label: 'Необязательная метка',
    },
    api_keys: {
      title: 'API-ключи',
      api_key: 'API Key',
      api_key_placeholder: 'Вставьте API key',
      secret_key: 'Secret Key',
      secret_key_placeholder: 'Вставьте secret key',
      passphrase: 'Passphrase',
      passphrase_placeholder: 'Passphrase OKX',
      required: 'API Key и Secret Key обязательны.',
    },
    save_keys: 'Сохранить ключи',
    saved_alert: { title: 'Сохранено' },
    saved_accounts: {
      title: 'Сохранённые аккаунты',
      empty: 'Сохранённых аккаунтов пока нет.',
    },
  },

  common: {
    ok: 'ОК',
    error: 'Ошибка',
    account_format: 'Аккаунт {{index}}',
    cancel: 'Отмена',
    delete: 'Удалить',
    confirm_delete: 'Вы уверены, что хотите удалить этот аккаунт?',
  },

  error: {
    too_many_requests: 'Слишком много запросов',
    no_data: 'Нет данных',
    decoding_error: 'Ошибка декодирования',
    waf_limit: 'Лимит WAF (Web Application Firewall)',
    cancel_replace: 'Операция cancelReplace частично выполнена: отмена могла не пройти, а новый ордер мог быть размещён.',
    banned_ip: 'IP автоматически заблокирован из-за продолжения запросов после ответов 429.',
    malformed_request: 'Некорректный запрос: проблема на стороне отправителя.',
    exchange_side: 'Проблема на стороне биржи.',
    unknown: 'Неизвестная ошибка',
    incorrect_api_url: 'Некорректный URL API',
    invalid_api_keys_format: 'Неверные API-ключи для {{exchange}}',
  },

} as const;

export default ru;
