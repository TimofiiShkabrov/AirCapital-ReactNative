export const monitorEn = {
  loadingData: "Loading data…",
  processing: "Processing…",
  accountNotFound:
    "This account was not found. Return to Settings to check your connections.",
  interfaceSettings: "Interface",
  privacyData: "Privacy and data",
  helpSettings: "Help",
  mobileConnection: "Connect in the mobile app",
  mobileConnectionHint:
    "API keys can be added on iOS and Android. The web version is a demo.",
  connectionSummary: "Read-only access to exchange balances",
  connectionHelpSummary: "API setup and supported wallets",
  backupsSummary: "Export and restore your history",
  monitoringDetails: "How monitoring works",
  monitoringSummary:
    "AirCapital combines exchange balances and tracks changes. It does not place orders or move your funds.",
  connectionHelp: "How to connect an exchange",
  guideFor: "Connection guide · {{exchange}}",
  officialSource: "Official help · {{exchange}}",
  guideIntro:
    "Use the exchange’s official pages for current API information. Below are the settings required for AirCapital. The exchange may show its page in English.",
  officialGuide: "Open official instructions",
  apiManagement: "Open official API management",
  apiDocumentation: "Official API documentation",
  linkOpenError:
    "Could not open the page. Check your connection and try again.",
  createForAirCapital: "Create a key for AirCapital",
  creation_binance:
    "Profile → Account → API Management → Create API. Choose System-generated (HMAC), name it AirCapital and complete the exchange’s verification. AirCapital requires an API Key and Secret Key.",
  creation_bybit:
    "Use the Bybit website: Profile → API → Create New Key. Choose a system-generated HMAC key and complete 2FA. The Bybit mobile app does not create API keys; new accounts may face a 48-hour restriction.",
  creation_okx:
    "Profile → API and connections → Create API key. Name it AirCapital and create an API passphrase. Use a manually created key; keep API Key, Secret Key and this passphrase for the connection.",
  creation_bingx:
    "Open the official API Management page, sign in and select Create API. Name the key AirCapital and complete the requested security verification. Copy its API Key and Secret Key.",
  creation_gateio:
    "Profile → API Management → Create API Key. Select API v4 Key for your real account and name it AirCapital. Complete the exchange’s security verification and copy Key and Secret.",
  guideIP:
    "AirCapital connects directly from your device; it has no shared server IP. If you use an IP allowlist, it must include your stable outgoing IP. Changing Wi-Fi, mobile networks or VPN may then block access. Do not copy another service’s IP addresses.",
  finishConnection: "Connect the key to AirCapital",
  guideStep1:
    "In AirCapital for iOS or Android, open Settings → Connect exchange and select {{exchange}}. You can give the account a name.",
  guideStep2:
    "Paste API Key into “API key” and Secret Key into “API secret”. Copy the full values while the exchange displays them.",
  guideStepPassphrase:
    "Enter the API passphrase you created on OKX. It is not your account login password.",
  guideStep3:
    "Confirm that trading, withdrawals and transfers are disabled, then tap “Verify and connect”.",
  guideStep4:
    "Wait for the result. A partial connection means some wallets or prices could not be read. Open Overview → Exchanges and inspect the wallet breakdown.",
  guideSecrets:
    "Passwords, 2FA codes and recovery phrases are never needed in AirCapital. Enter exchange verification codes only on the exchange’s own site.",
  connectionTrouble: "If connection fails",
  guideTrouble:
    "Check the selected exchange, the complete key/secret and the OKX passphrase. Use real-account keys, not testnet/demo keys. Regional exchange domains are not supported yet.",

  backups: "Backup and recovery",
  backupExplanation:
    "Export contains financial history, not API keys. Keep it privately. Import merges records; conflicting records stop the import. Reconnect restored accounts to resume updates.",
  importData: "Import backup",
  importPreview:
    "Add accounts: {{accounts}}; observations: {{snapshots}}; cash flows: {{flows}}; archived plans: {{archive}}. Existing records and keys are preserved. No keys are imported. Confirm cash-flow completeness again after new data is added.",
  restored: "Backup restored. Reconnect accounts marked as needing keys.",
  invalidBackup: "Invalid or unsupported backup. No data was imported.",
  backupConflict:
    "The file conflicts with existing records. Import stopped; current data is preserved.",
  backupTooLarge: "Maximum backup size: 20 MB.",
  unfinishedAccount:
    "Finish reconnecting or deleting incomplete accounts before importing or exporting.",
  deleteAll: "Delete all local data",
  deleteAllConfirm:
    "Delete all saved API keys, accounts, history, cash flows, archived plans and preferences from this app? This cannot be undone without an exported backup. Exported files and exchange balances/orders are unaffected.",
  needsKeys: "History restored · reconnect API keys",
  reconnect: "Replace / reconnect keys",
  reconnectHint:
    "Enter new read-only keys in the connection form above. The account identity and its history will be preserved. Use keys for the same exchange account.",
  coverageTitle: "Supported balances",
  coverageBinance:
    "Wallet balances returned by Binance wallet/balance in USDT. Products absent from that response are not included.",
  coverageBybit:
    "Wallet equity, Funding, Flexible Saving and OnChain Earn. Other Earn products are excluded; processing positions make the result incomplete.",
  coverageGate:
    "Gate.io total balance and the wallet breakdown returned by its API. Products absent from the response are not included.",
  coverageNote:
    "Coverage describes supported API data, not every exchange product. Regional domains are not yet supported. Missing prices and unavailable wallets are marked separately.",
  manualFlowsNote:
    "Deposits and withdrawals are entered manually. There is no automatic transaction import yet.",
  keyHelp:
    "If a key expires or is revoked, create a new read-only key and use Replace / reconnect keys for the same account. For access errors, check permissions, IP restrictions and regional domain. Never enable trading or withdrawals to resolve an error.",
  guide_binance:
    "Binance: create a separate API key with Reading only; disable trading, futures trading, withdrawals and transfers.",
  guide_bybit:
    "Bybit: create a read-only API key with access to the required wallets and supported Earn positions. Missing Earn access is shown as incomplete coverage.",
  guide_okx:
    "OKX: create a Read-only API key and enter its passphrase. Trading equity and Funding are included; Earn is excluded.",
  guide_bingx:
    "BingX: create a key for reading Spot and Futures balances. Disable trading and withdrawals. Permission verification is currently based on your confirmation.",
  guide_gateio:
    "Gate.io: create an API v4 key with read-only access to required accounts. Disable all write permissions. Permission verification is currently based on your confirmation.",

  filterExchange: "Filter by exchange",
  overview: "Overview",
  exchanges: "Exchanges",
  statistics: "Statistics",
  settings: "Settings",
  all: "All exchanges",
  total: "Total deposit",
  partialTotal: "Known balance",
  balance: "Exchange deposit",
  unit: "USDT",
  change: "Balance change",
  period: "Selected period",
  day: "24 hours",
  week: "7 days",
  month: "30 days",
  allTime: "All time",
  date: "Date",
  demo: "Demo · fictional data",
  readOnly: "Read only",
  sources: "Deposits by exchange",
  accounts: "Accounts",
  wallets: "Balance breakdown",
  details: "Details",
  hidden: "Hide amounts",
  visible: "Show amounts",
  theme: "Appearance",
  language: "Language",
  system: "System",
  light: "Light",
  dark: "Dark",
  refresh: "Refresh balances",
  refreshing: "Updating balances…",
  fresh: "Updated",
  partial: "Partial data",
  stale: "Last known balance",
  error: "Unavailable",
  connectionRequired: "Connection needs attention",
  updateUnavailable: "Could not update the balance",
  reconnectExchange: "Reconnect exchange",
  reconnectHistory: "Reconnect this account to keep its saved history.",
  credentialsExpired: "The API key has expired. Create a new read-only key and replace it here.",
  credentialsRejected: "The exchange rejected authentication. Check the key, secret, permissions, IP restrictions and exchange region; replace the key if it was revoked.",
  apiPermissionDenied: "The key cannot read the requested data. Check read permissions on the exchange; keep trading and withdrawals disabled.",
  apiIpRestricted: "The exchange rejected this IP address. Check the API key’s IP allowlist.",
  balanceUnavailable: "Balance unavailable",
  restoreToContinue: "Restore the connections below to resume balance updates and statistics.",
  retryBalance: "The exchanges did not return a balance. Try refreshing again later.",
  savedBalance: "Saved balance",
  savedAt: "Saved on {{date}}. These values have not been updated.",
  notObserved: "No successful update yet",
  lastSuccess: "Last success",
  noHistory: "History starts with your first successful update.",
  historyNeeded: "Two confirmed observations are needed to calculate a change.",
  historySince: "Observed from {{date}}",
  originalHistory:
    "Earlier snapshots used the previous calculation method. They remain in your export; new statistics use verified observations.",
  deposits: "Deposits",
  withdrawals: "Withdrawals",
  opening: "Opening balance",
  closing: "Closing balance",
  result: "Change excluding deposits & withdrawals",
  flowsUnknown:
    "Cash flow history is not confirmed. Balance change is not investment return.",
  flowComplete: "Cash flows confirmed by you for these dates",
  contribution: "Contribution to balance change",
  allValues: "All amounts in USDT",
  completeWallets: "Included wallets",
  sourceNote: "Valuation source",
  emptyTitle: "All your deposits, together",
  emptyBody:
    "Connect your exchanges to see balances, changes and history in one place.",
  connect: "Connect an exchange",
  tryDemo: "Explore the demo",
  exitDemo: "Exit demo",
  addAccount: "Add account",
  add: "Connect",
  cancel: "Cancel",
  close: "Close",
  back: "Back",
  name: "Account name",
  optional: "Optional",
  apiKey: "API key",
  secret: "API secret",
  passphrase: "Passphrase",
  required: "Complete the required fields, including the OKX passphrase.",
  instruction:
    "Create a dedicated API key with reading enabled. Disable trading, withdrawals and transfers. Your keys stay on this device.",
  acknowledge: "I created a key for reading only",
  checkConnection: "Check and connect",
  checking: "Checking permissions and balances…",
  connected: "Account connected",
  unsupportedWeb:
    "Real API keys are supported in the iOS and Android apps. The web version offers the demo only.",
  partialConnection:
    "Connected with partial wallet coverage. Open the account to see missing data.",
  permissionDeclared:
    "Key permissions declared by you; this exchange adapter cannot verify them.",
  remove: "Remove",
  confirmDelete:
    "Remove this account, its stored keys and related history? This does not revoke the key or cancel orders on the exchange.",
  retryDelete: "Retry removal",
  incompleteSetup: "Setup incomplete — remove and reconnect",
  deletePending: "Removal incomplete — retry to clear the keys",
  saved: "Saved",
  storageError:
    "Could not read or save protected data. Nothing was reset. Retry on your unlocked device.",
  genericError: "The operation failed. Check the connection and try again.",
  readOnlyRequired:
    "Use a key with reading only. Trading, withdrawal or transfer permissions must be disabled.",
  missingKeys: "Keys are missing or this account needs setup/removal recovery.",
  exchangeResponse:
    "The exchange rejected the request. Check the key, permissions and account type.",
  invalidResponse:
    "The exchange returned an unexpected response. The previous balance was preserved.",
  tooManyRequests: "Exchange request limit reached. Try again later.",
  timeout: "The exchange did not respond in time.",
  coverageOKX:
    "Coverage: Trading and Funding. Earn products are not included yet.",
  coverageBingX:
    "Coverage: Spot and Futures. Earn products are not included yet.",
  unpriced: "Some assets have no confirmed USDT price.",
  unavailable: "This wallet could not be updated.",
  archive: "Archived trading plans",
  migration:
    "Trading has been removed. Orders already placed on exchanges remain active. Review them on the exchange and replace old keys with read-only keys.",
  noPlans: "No archived trading plans",
  orderIds: "Exchange order IDs",
  privacy: "Privacy",
  appLock: "Require device authentication",
  unlock: "Unlock AirCapital",
  locked: "Your balances are protected",
  authUnavailable: "Set up a device passcode or biometrics first.",
  authFailed: "Authentication was not completed. Try again.",
  export: "Export data",
  exportNote:
    "Export contains financial history in readable form, without API keys. Share it only with people you choose.",
  exportAction: "Create export",
  noExport: "There is no saved history to export yet.",
  exported: "Export ready",
  flows: "Deposits & withdrawals",
  addFlow: "Record a cash flow",
  amount: "Amount in USDT",
  occurredAt: "Date and time (YYYY-MM-DD HH:mm)",
  flowType: "Type",
  deposit: "Deposit",
  withdrawal: "Withdrawal",
  save: "Save",
  invalidFlow:
    "Enter a positive amount and a valid date that is not in the future.",
  confirmFlows: "I recorded all flows for this period",
  confirmFlowsBody:
    "Confirm only if all deposits and withdrawals between the displayed opening and closing dates are recorded for every selected account. For transfers between your own accounts, record the same principal on both sides. Exclude transfer fees from these flow amounts so fees remain in the result.",
  flowManual: "Manually recorded",
  noFlows: "No cash flows recorded",
  noReturn: "Not enough confirmed cash flow history",
  deleteFlow: "Delete this cash flow",
  noPercent: "Percentage unavailable for a zero or negative opening balance",
  background:
    "Balances refresh while the app is open. Continuous background monitoring is not enabled.",
  securityNote:
    "History is encrypted on this device. Keep exports for recovery; encrypted local data may be unavailable after reinstalling or moving to another device.",
  safety: "Permissions & storage",
  from: "From",
  to: "To",
  chooseAccount: "Choose an account",
  unknownWallet: "Unknown wallet",
  privacyUnavailable:
    "System preview protection could not be enabled on this device.",
};
export const monitorRu: typeof monitorEn = {
  loadingData: "Загружаем данные…",
  processing: "Выполняем операцию…",
  accountNotFound: "Аккаунт не найден. Проверьте подключения в настройках.",
  interfaceSettings: "Интерфейс",
  privacyData: "Приватность и данные",
  helpSettings: "Справка",
  mobileConnection: "Подключение в приложении",
  mobileConnectionHint:
    "API-ключи добавляются на iOS и Android. Веб-версия работает в деморежиме.",
  connectionSummary: "Доступ к балансам только для чтения",
  connectionHelpSummary: "Настройка API и поддерживаемые кошельки",
  backupsSummary: "Экспорт и восстановление истории",
  monitoringDetails: "Как работает мониторинг",
  monitoringSummary:
    "AirCapital объединяет балансы бирж и отслеживает их изменения. Приложение не выставляет ордера и не перемещает средства.",
  connectionHelp: "Как подключить биржу",
  guideFor: "Инструкция · {{exchange}}",
  officialSource: "Официальная справка · {{exchange}}",
  guideIntro:
    "Актуальная информация об API — на официальных страницах биржи. Ниже указаны настройки для AirCapital. Страница биржи может открыться на английском.",
  officialGuide: "Открыть официальную инструкцию",
  apiManagement: "Открыть управление API на бирже",
  apiDocumentation: "Официальная документация API",
  linkOpenError:
    "Не удалось открыть страницу. Проверьте соединение и попробуйте снова.",
  createForAirCapital: "Создание ключа для AirCapital",
  creation_binance:
    "Профиль → Аккаунт → Управление API → Создать API. Выберите System-generated (HMAC), задайте имя AirCapital и пройдите проверку биржи. Для подключения нужны API Key и Secret Key.",
  creation_bybit:
    "Откройте сайт Bybit: Профиль → API → Создать новый ключ. Выберите системный HMAC-ключ и пройдите 2FA. В приложении Bybit создание недоступно; для нового аккаунта возможно ограничение на первые 48 часов.",
  creation_okx:
    "Профиль → API и подключения → Создать API-ключ. Задайте имя AirCapital и отдельную API-пассфразу. Создайте ключ вручную; сохраните API Key, Secret Key и эту пассфразу для подключения.",
  creation_bingx:
    "Откройте официальную страницу управления API, войдите и нажмите Create API. Назовите ключ AirCapital и пройдите проверку безопасности биржи. Скопируйте API Key и Secret Key.",
  creation_gateio:
    "Профиль → Управление API → Создать API-ключ. Выберите API v4 Key для реального аккаунта и имя AirCapital. Пройдите проверку безопасности биржи и скопируйте Key и Secret.",
  guideIP:
    "AirCapital обращается к бирже напрямую с устройства; общего серверного IP нет. Если используете белый список IP, в нём должен быть ваш стабильный внешний IP. Смена Wi-Fi, мобильной сети или VPN может заблокировать доступ. Не копируйте IP-адреса других сервисов.",
  finishConnection: "Подключение ключа к AirCapital",
  guideStep1:
    "В AirCapital для iOS или Android откройте Настройки → Подключить биржу и выберите {{exchange}}. При желании задайте название аккаунта.",
  guideStep2:
    "Вставьте API Key в поле «API-ключ», а Secret Key — в «Секрет API». Скопируйте значения полностью, пока биржа их показывает.",
  guideStepPassphrase:
    "Укажите API-пассфразу, созданную на OKX. Это не пароль входа в аккаунт.",
  guideStep3:
    "Подтвердите, что торговля, выводы и переводы отключены, затем нажмите кнопку проверки и подключения.",
  guideStep4:
    "Дождитесь результата. Частичное подключение означает, что часть кошельков или цен не удалось прочитать. Откройте обзор бирж и проверьте состав депозита.",
  guideSecrets:
    "Пароли входа, коды 2FA и seed-фразы AirCapital не нужны. Коды подтверждения вводите только на сайте самой биржи.",
  connectionTrouble: "Если подключение не удалось",
  guideTrouble:
    "Проверьте выбранную биржу, полноту ключа/секрета и пассфразу OKX. Нужны ключи реального аккаунта, а не testnet/demo. Региональные домены бирж пока не поддерживаются.",

  backups: "Резервные копии",
  backupExplanation:
    "Экспорт содержит финансовую историю без API-ключей. Храните файл приватно. Импорт объединяет записи; при конфликте останавливается. Для обновления восстановленных аккаунтов подключите ключи заново.",
  importData: "Восстановить из файла",
  importPreview:
    "Будет добавлено: аккаунтов — {{accounts}}, наблюдений — {{snapshots}}, операций — {{flows}}, архивных планов — {{archive}}. Текущие записи и ключи сохранятся. Ключи не импортируются. После добавления данных подтвердите полноту денежных потоков заново.",
  restored:
    "Данные восстановлены. Подключите ключи аккаунтов с соответствующей пометкой.",
  invalidBackup:
    "Некорректный или неподдерживаемый файл. Данные не импортированы.",
  backupConflict:
    "В файле есть конфликтующие записи. Импорт остановлен, текущие данные сохранены.",
  backupTooLarge: "Максимальный размер файла — 20 МБ.",
  unfinishedAccount:
    "Перед импортом или экспортом завершите подключение или удаление незавершённых аккаунтов.",
  deleteAll: "Удалить все локальные данные",
  deleteAllConfirm:
    "Удалить из приложения все ключи, аккаунты, историю, операции, архивные планы и настройки? Восстановление возможно только из ранее сохранённого файла. Файлы экспорта, средства и ордера на биржах останутся.",
  needsKeys: "История восстановлена · подключите ключи",
  reconnect: "Заменить / подключить ключи",
  reconnectHint:
    "Введите новые ключи только для чтения в форме подключения выше. Аккаунт и его история сохранятся. Используйте ключи того же биржевого аккаунта.",
  coverageTitle: "Какие средства учитываются",
  coverageBinance:
    "Балансы кошельков из Binance wallet/balance в USDT. Продукты, отсутствующие в этом ответе биржи, не учитываются.",
  coverageBybit:
    "Equity кошелька, Funding, Flexible Saving и OnChain Earn. Другие Earn-продукты не включены; позиции в обработке дают неполный результат.",
  coverageGate:
    "Общий баланс Gate.io и разбивка кошельков из API. Продукты, отсутствующие в ответе, не учитываются.",
  coverageNote:
    "Покрытие описывает поддерживаемые данные API. Региональные домены пока не поддерживаются. Неизвестные цены и недоступные кошельки отмечаются отдельно.",
  manualFlowsNote:
    "Пополнения и выводы вносятся вручную. Автоматического импорта операций пока нет.",
  keyHelp:
    "Если ключ истёк или отозван, создайте новый ключ только для чтения и выберите «Заменить / подключить ключи» у того же аккаунта. При ошибке доступа проверьте права, ограничения IP и региональный домен. Не включайте торговлю или вывод средств для устранения ошибки.",
  guide_binance:
    "Binance: создайте отдельный API-ключ только с чтением. Отключите торговлю, фьючерсную торговлю, выводы и переводы.",
  guide_bybit:
    "Bybit: создайте read-only ключ с доступом к нужным кошелькам и поддерживаемым Earn-позициям. Без доступа к Earn результат будет помечен неполным.",
  guide_okx:
    "OKX: создайте ключ с правом Read и укажите его passphrase. Учитываются Trading equity и Funding; Earn не включён.",
  guide_bingx:
    "BingX: создайте ключ для чтения Spot и Futures. Отключите торговлю и выводы. Проверка прав пока основана на вашем подтверждении.",
  guide_gateio:
    "Gate.io: создайте ключ API v4 с чтением нужных счетов. Отключите все права записи. Проверка прав пока основана на вашем подтверждении.",

  filterExchange: "Фильтр биржи",
  overview: "Обзор",
  exchanges: "Биржи",
  statistics: "Статистика",
  settings: "Настройки",
  all: "Все биржи",
  total: "Общий депозит",
  partialTotal: "Известный баланс",
  balance: "Депозит на бирже",
  unit: "USDT",
  change: "Изменение баланса",
  period: "Выбранный период",
  day: "24 часа",
  week: "7 дней",
  month: "30 дней",
  allTime: "Всё время",
  date: "Дата",
  demo: "Демо · вымышленные данные",
  readOnly: "Только чтение",
  sources: "Депозиты по биржам",
  accounts: "Аккаунты",
  wallets: "Состав депозита",
  details: "Подробнее",
  hidden: "Скрыть суммы",
  visible: "Показать суммы",
  theme: "Оформление",
  language: "Язык",
  system: "Системная",
  light: "Светлая",
  dark: "Тёмная",
  refresh: "Обновить балансы",
  refreshing: "Обновление балансов…",
  fresh: "Обновлено",
  partial: "Неполные данные",
  stale: "Последний известный баланс",
  error: "Недоступно",
  connectionRequired: "Проверьте подключение",
  updateUnavailable: "Не удалось обновить баланс",
  reconnectExchange: "Переподключить биржу",
  reconnectHistory: "Замените ключи этого аккаунта — сохранённая история останется.",
  credentialsExpired: "Срок действия API-ключа истёк. Создайте новый ключ только для чтения и замените его здесь.",
  credentialsRejected: "Биржа отклонила авторизацию. Проверьте ключ, секрет, права, ограничения IP и регион биржи. Если ключ отозван — замените его.",
  apiPermissionDenied: "Ключу не хватает доступа к данным. Проверьте права чтения на бирже; торговлю и вывод средств оставьте отключёнными.",
  apiIpRestricted: "Биржа отклонила этот IP-адрес. Проверьте список разрешённых IP в настройках API-ключа.",
  balanceUnavailable: "Баланс пока недоступен",
  restoreToContinue: "Восстановите подключения ниже, чтобы продолжить обновление балансов и статистики.",
  retryBalance: "Биржи не вернули баланс. Попробуйте обновить данные позже.",
  savedBalance: "Сохранённый баланс",
  savedAt: "Данные на {{date}}. Эти значения ещё не обновлены.",
  notObserved: "Успешных обновлений ещё нет",
  lastSuccess: "Последнее успешное",
  noHistory: "История начнётся с первого успешного обновления.",
  historyNeeded: "Для расчёта изменения нужны два подтверждённых снимка.",
  historySince: "Наблюдения с {{date}}",
  originalHistory:
    "Ранние снимки рассчитаны прежним методом. Они сохранены в экспорте; новая статистика использует проверенные наблюдения.",
  deposits: "Пополнения",
  withdrawals: "Выводы",
  opening: "На начало периода",
  closing: "На конец периода",
  result: "Результат без пополнений и выводов",
  flowsUnknown:
    "История денежных потоков не подтверждена. Изменение баланса не равно доходности.",
  flowComplete: "Вы подтвердили потоки за эти даты",
  contribution: "Вклад в изменение баланса",
  allValues: "Все значения в USDT",
  completeWallets: "Учтённые кошельки",
  sourceNote: "Источник оценки",
  emptyTitle: "Все депозиты — вместе",
  emptyBody:
    "Подключите биржи, чтобы видеть балансы, изменения и историю в одном приложении.",
  connect: "Подключить биржу",
  tryDemo: "Посмотреть демо",
  exitDemo: "Выйти из демо",
  addAccount: "Добавить аккаунт",
  add: "Подключить",
  cancel: "Отмена",
  close: "Закрыть",
  back: "Назад",
  name: "Название аккаунта",
  optional: "Необязательно",
  apiKey: "API-ключ",
  secret: "Секрет API",
  passphrase: "Парольная фраза",
  required: "Заполните обязательные поля, включая парольную фразу для OKX.",
  instruction:
    "Создайте отдельный API-ключ с доступом к чтению. Отключите торговлю, выводы и переводы. Ключи хранятся на этом устройстве.",
  acknowledge: "Я создал ключ только для чтения",
  checkConnection: "Проверить и подключить",
  checking: "Проверка прав и балансов…",
  connected: "Аккаунт подключён",
  unsupportedWeb:
    "Настоящие API-ключи поддерживаются в приложениях iOS и Android. В веб-версии доступно демо.",
  partialConnection:
    "Подключено с неполным покрытием кошельков. Откройте аккаунт, чтобы увидеть недостающие данные.",
  permissionDeclared:
    "Права ключа подтверждены вами; адаптер этой биржи пока не может проверить их автоматически.",
  remove: "Удалить",
  confirmDelete:
    "Удалить аккаунт, сохранённые ключи и связанную историю? Это не отзывает ключ и не отменяет ордера на бирже.",
  retryDelete: "Повторить удаление",
  incompleteSetup: "Настройка не завершена — удалите и подключите заново",
  deletePending: "Удаление не завершено — повторите очистку ключей",
  saved: "Сохранено",
  storageError:
    "Не удалось прочитать или сохранить защищённые данные. Ничего не сброшено. Повторите на разблокированном устройстве.",
  genericError: "Операция не выполнена. Проверьте подключение и повторите.",
  readOnlyRequired:
    "Нужен ключ только для чтения. Отключите права торговли, вывода и перевода средств.",
  missingKeys:
    "Ключи отсутствуют либо нужно завершить настройку или удаление аккаунта.",
  exchangeResponse:
    "Биржа отклонила запрос. Проверьте ключ, права и тип аккаунта.",
  invalidResponse:
    "Биржа вернула неожиданный ответ. Предыдущий баланс сохранён.",
  tooManyRequests: "Достигнут лимит запросов биржи. Повторите позже.",
  timeout: "Биржа не ответила вовремя.",
  coverageOKX:
    "Покрытие: Trading и Funding. Продукты Earn пока не учитываются.",
  coverageBingX: "Покрытие: Spot и Futures. Продукты Earn пока не учитываются.",
  unpriced: "Для части активов нет подтверждённой цены в USDT.",
  unavailable: "Этот кошелёк не удалось обновить.",
  archive: "Архив торговых планов",
  migration:
    "Торговля удалена из приложения. Уже выставленные ордера продолжают действовать на биржах. Проверьте их на бирже и замените старые ключи на ключи только для чтения.",
  noPlans: "Архивных торговых планов нет",
  orderIds: "Идентификаторы ордеров",
  privacy: "Приватность",
  appLock: "Требовать разблокировку устройства",
  unlock: "Разблокировать AirCapital",
  locked: "Ваши балансы защищены",
  authUnavailable: "Сначала настройте код устройства или биометрию.",
  authFailed: "Разблокировка не завершена. Повторите попытку.",
  export: "Экспорт данных",
  exportNote:
    "Экспорт содержит финансовую историю в читаемом виде, без API-ключей. Передавайте его только выбранным вами людям.",
  exportAction: "Создать экспорт",
  noExport: "Сохранённой истории для экспорта пока нет.",
  exported: "Экспорт готов",
  flows: "Пополнения и выводы",
  addFlow: "Записать денежный поток",
  amount: "Сумма в USDT",
  occurredAt: "Дата и время (ГГГГ-ММ-ДД ЧЧ:мм)",
  flowType: "Тип",
  deposit: "Пополнение",
  withdrawal: "Вывод",
  save: "Сохранить",
  invalidFlow: "Укажите положительную сумму и корректную дату не в будущем.",
  confirmFlows: "Я записал все потоки за период",
  confirmFlowsBody:
    "Подтверждайте только если записаны все пополнения и выводы между показанными начальной и конечной датами для каждого выбранного аккаунта. Для переводов между своими счетами запишите одинаковую основную сумму по обеим сторонам. Не включайте комиссию в суммы потоков: она останется в результате.",
  flowManual: "Внесено вручную",
  noFlows: "Денежные потоки не записаны",
  noReturn: "Не хватает подтверждённой истории потоков",
  deleteFlow: "Удалить денежный поток",
  noPercent:
    "Процент недоступен при нулевом или отрицательном начальном балансе",
  background:
    "Балансы обновляются, пока приложение открыто. Непрерывный фоновый мониторинг пока не включён.",
  securityNote:
    "История зашифрована на этом устройстве. Сохраняйте экспорт для восстановления: после переустановки или смены устройства локальные зашифрованные данные могут быть недоступны.",
  safety: "Права доступа и хранение",
  from: "С",
  to: "По",
  chooseAccount: "Выберите аккаунт",
  unknownWallet: "Неизвестный кошелёк",
  privacyUnavailable:
    "Системную защиту превью не удалось включить на этом устройстве.",
};
export const monitorAr: typeof monitorEn = {
  ...monitorEn,
  loadingData: "جارٍ تحميل البيانات…",
  processing: "جارٍ تنفيذ العملية…",
  accountNotFound: "لم يتم العثور على الحساب. تحقّق من الاتصالات في الإعدادات.",
  interfaceSettings: "الواجهة",
  privacyData: "الخصوصية والبيانات",
  helpSettings: "المساعدة",
  mobileConnection: "الربط في تطبيق الهاتف",
  mobileConnectionHint:
    "تُضاف مفاتيح API على iOS وAndroid. نسخة الويب للتجربة.",
  connectionSummary: "الوصول للقراءة فقط إلى أرصدة المنصات",
  connectionHelpSummary: "إعداد API والمحافظ المدعومة",
  backupsSummary: "تصدير السجل واستعادته",
  monitoringDetails: "كيف تعمل المراقبة",
  monitoringSummary:
    "يجمع AirCapital أرصدة المنصات ويتابع تغيّرها. لا يضع التطبيق أوامر ولا ينقل أموالك.",
  connectionHelp: "كيفية ربط منصة",
  guideFor: "دليل الربط · {{exchange}}",
  officialSource: "المساعدة الرسمية · {{exchange}}",
  guideIntro:
    "راجع الصفحات الرسمية للمنصة لمعرفة معلومات API الحالية. إعدادات AirCapital موضحة أدناه. قد تُعرض صفحة المنصة بالإنجليزية.",
  officialGuide: "فتح التعليمات الرسمية",
  apiManagement: "فتح إدارة API الرسمية",
  apiDocumentation: "توثيق API الرسمي",
  linkOpenError: "تعذّر فتح الصفحة. تحقّق من الاتصال وحاول مجددًا.",
  createForAirCapital: "إنشاء مفتاح لـ AirCapital",
  creation_binance:
    "الملف الشخصي ← الحساب ← إدارة API ← إنشاء API. اختر System-generated (HMAC)، وسمّه AirCapital وأكمل التحقق. يلزم API Key وSecret Key.",
  creation_bybit:
    "استخدم موقع Bybit: الملف الشخصي ← API ← إنشاء مفتاح جديد. اختر مفتاح HMAC مولّدًا من النظام وأكمل 2FA. لا يتيح تطبيق Bybit إنشاء المفاتيح؛ قد تنتظر الحسابات الجديدة ٤٨ ساعة.",
  creation_okx:
    "الملف الشخصي ← API والاتصالات ← إنشاء مفتاح API. سمّه AirCapital وأنشئ عبارة مرور خاصة بـ API. أنشئ المفتاح يدويًا واحتفظ بـ API Key وSecret Key وعبارة المرور للربط.",
  creation_bingx:
    "افتح صفحة إدارة API الرسمية وسجّل الدخول واختر Create API. سمّ المفتاح AirCapital وأكمل التحقق الأمني. انسخ API Key وSecret Key.",
  creation_gateio:
    "الملف الشخصي ← إدارة API ← إنشاء مفتاح API. اختر API v4 Key لحسابك الحقيقي وسمّه AirCapital. أكمل التحقق الأمني وانسخ Key وSecret.",
  guideIP:
    "يتصل AirCapital مباشرة من جهازك ولا يملك عنوان IP خادم مشتركًا. إذا استخدمت قائمة IP مسموحة فيجب أن تتضمن عنوان اتصالك الخارجي الثابت. قد يمنع تغيير الشبكة أو VPN الوصول. لا تنسخ عناوين خدمة أخرى.",
  finishConnection: "ربط المفتاح بـ AirCapital",
  guideStep1:
    "في AirCapital على iOS أو Android افتح الإعدادات ← ربط منصة واختر {{exchange}}. يمكنك تسمية الحساب.",
  guideStep2:
    "ألصق API Key في حقل مفتاح API وSecret Key في حقل سر API. انسخ القيم كاملة أثناء عرضها على المنصة.",
  guideStepPassphrase:
    "أدخل عبارة مرور API التي أنشأتها على OKX، وليست كلمة مرور تسجيل الدخول.",
  guideStep3: "أكّد تعطيل التداول والسحب والتحويلات، ثم اضغط زر التحقق والربط.",
  guideStep4:
    "انتظر النتيجة. الربط الجزئي يعني تعذّر قراءة بعض المحافظ أو الأسعار. افتح عرض المنصات وراجع تفاصيل الرصيد.",
  guideSecrets:
    "لا يحتاج AirCapital إلى كلمات مرور الدخول أو رموز 2FA أو عبارات الاسترداد. أدخل رموز التحقق على موقع المنصة نفسها فقط.",
  connectionTrouble: "إذا فشل الاتصال",
  guideTrouble:
    "تحقّق من المنصة والمفتاح والسر وعبارة مرور OKX. استخدم مفاتيح الحساب الحقيقي وليس testnet/demo. النطاقات الإقليمية غير مدعومة بعد.",

  backups: "النسخ الاحتياطي والاستعادة",
  backupExplanation:
    "يتضمن التصدير السجل المالي دون مفاتيح API. احفظه بسرية. يدمج الاستيراد السجلات ويتوقف عند التعارض. أعد ربط الحسابات المستعادة لتحديثها.",
  importData: "استيراد نسخة احتياطية",
  importPreview:
    "ستُضاف حسابات: {{accounts}}، أرصدة: {{snapshots}}، تدفقات: {{flows}}، خطط مؤرشفة: {{archive}}. تُحفظ السجلات والمفاتيح الحالية ولا تُستورد مفاتيح. أكّد اكتمال التدفقات مجددًا بعد إضافة البيانات.",
  restored: "تمت الاستعادة. أعد ربط الحسابات التي تحتاج مفاتيح.",
  invalidBackup: "نسخة غير صالحة أو غير مدعومة. لم تُستورد بيانات.",
  backupConflict:
    "يتعارض الملف مع سجلات موجودة. توقف الاستيراد وحُفظت البيانات الحالية.",
  backupTooLarge: "الحد الأقصى للملف ٢٠ ميغابايت.",
  unfinishedAccount:
    "أكمل ربط الحسابات غير المكتملة أو حذفها قبل الاستيراد أو التصدير.",
  deleteAll: "حذف جميع البيانات المحلية",
  deleteAllConfirm:
    "هل تريد حذف المفاتيح والحسابات والسجل والتدفقات والأرشيف والإعدادات من التطبيق؟ لا يمكن التراجع دون نسخة مصدّرة. لن تتأثر ملفات التصدير أو أرصدة وأوامر المنصات.",
  needsKeys: "تمت استعادة السجل · أعد ربط المفاتيح",
  reconnect: "استبدال / إعادة ربط المفاتيح",
  reconnectHint:
    "أدخل مفاتيح جديدة للقراءة فقط في النموذج أعلاه. ستُحفظ هوية الحساب وسجله. استخدم مفاتيح الحساب نفسه على المنصة.",
  coverageTitle: "الأرصدة المدعومة",
  coverageBinance:
    "أرصدة المحافظ التي يعيدها Binance wallet/balance بوحدة USDT. المنتجات غير الموجودة في الاستجابة غير مشمولة.",
  coverageBybit:
    "قيمة المحفظة وFunding وFlexible Saving وOnChain Earn. منتجات Earn الأخرى غير مشمولة، والمراكز قيد المعالجة تجعل النتيجة غير مكتملة.",
  coverageGate:
    "الرصيد الإجمالي وتفاصيل المحافظ التي تعيدها Gate.io. المنتجات غير الموجودة في الاستجابة غير مشمولة.",
  coverageNote:
    "التغطية تخص بيانات API المدعومة. النطاقات الإقليمية غير مدعومة حاليًا. تُميّز الأسعار المفقودة والمحافظ غير المتاحة.",
  manualFlowsNote:
    "تُدخل الإيداعات والسحوبات يدويًا. لا يوجد استيراد تلقائي للمعاملات حاليًا.",
  keyHelp:
    "إذا انتهى المفتاح أو أُلغي، أنشئ مفتاحًا جديدًا للقراءة فقط وأعد ربط الحساب نفسه. عند خطأ الوصول راجع الأذونات وقيود IP والنطاق الإقليمي. لا تفعّل التداول أو السحب لحل الخطأ.",
  guide_binance:
    "Binance: أنشئ مفتاح API للقراءة فقط، وعطّل التداول والعقود الآجلة والسحب والتحويل.",
  guide_bybit:
    "Bybit: أنشئ مفتاحًا للقراءة فقط مع الوصول للمحافظ ومراكز Earn المدعومة. يظهر غياب إذن Earn كتغطية غير مكتملة.",
  guide_okx:
    "OKX: أنشئ مفتاح Read-only وأدخل عبارة مروره. يشمل Trading equity وFunding دون Earn.",
  guide_bingx:
    "BingX: أنشئ مفتاحًا لقراءة Spot وFutures وعطّل التداول والسحب. يعتمد التحقق من الأذونات حاليًا على تأكيدك.",
  guide_gateio:
    "Gate.io: أنشئ مفتاح API v4 لقراءة الحسابات المطلوبة وعطّل كل أذونات الكتابة. يعتمد التحقق حاليًا على تأكيدك.",

  filterExchange: "تصفية حسب المنصة",
  overview: "نظرة عامة",
  exchanges: "المنصات",
  statistics: "الإحصاءات",
  settings: "الإعدادات",
  all: "كل المنصات",
  total: "إجمالي الرصيد",
  partialTotal: "الرصيد المعروف",
  balance: "رصيد المنصة",
  change: "تغير الرصيد",
  period: "الفترة المحددة",
  day: "٢٤ ساعة",
  week: "٧ أيام",
  month: "٣٠ يومًا",
  allTime: "كل الوقت",
  date: "التاريخ",
  demo: "عرض تجريبي · بيانات افتراضية",
  readOnly: "للقراءة فقط",
  sources: "الأرصدة حسب المنصة",
  accounts: "الحسابات",
  wallets: "تفاصيل الرصيد",
  details: "التفاصيل",
  hidden: "إخفاء المبالغ",
  visible: "إظهار المبالغ",
  theme: "المظهر",
  language: "اللغة",
  system: "النظام",
  light: "فاتح",
  dark: "داكن",
  refresh: "تحديث الأرصدة",
  refreshing: "جارٍ تحديث الأرصدة…",
  fresh: "تم التحديث",
  partial: "بيانات غير مكتملة",
  stale: "آخر رصيد معروف",
  error: "غير متاح",
  connectionRequired: "تحقق من الاتصال",
  updateUnavailable: "تعذر تحديث الرصيد",
  reconnectExchange: "إعادة ربط المنصة",
  reconnectHistory: "استبدل مفاتيح هذا الحساب للاحتفاظ بسجله المحفوظ.",
  credentialsExpired: "انتهت صلاحية مفتاح API. أنشئ مفتاحًا جديدًا للقراءة فقط واستبدله هنا.",
  credentialsRejected: "رفضت المنصة المصادقة. تحقق من المفتاح والسر والصلاحيات وقيود IP ومنطقة المنصة. استبدل المفتاح إذا تم إلغاؤه.",
  apiPermissionDenied: "لا يملك المفتاح صلاحية قراءة البيانات المطلوبة. تحقق من أذونات القراءة وأبقِ التداول والسحب معطّلين.",
  apiIpRestricted: "رفضت المنصة عنوان IP هذا. تحقق من قائمة عناوين IP المسموح بها للمفتاح.",
  balanceUnavailable: "الرصيد غير متاح حاليًا",
  restoreToContinue: "أعد ربط المنصات أدناه لاستئناف تحديث الأرصدة والإحصاءات.",
  retryBalance: "لم تُرجع المنصات رصيدًا. حاول تحديث البيانات لاحقًا.",
  savedBalance: "الرصيد المحفوظ",
  savedAt: "بيانات محفوظة بتاريخ {{date}}. لم تُحدّث هذه القيم بعد.",
  notObserved: "لا يوجد تحديث ناجح بعد",
  lastSuccess: "آخر تحديث ناجح",
  noHistory: "يبدأ السجل مع أول تحديث ناجح.",
  historyNeeded: "يلزم رصدان مؤكدان لحساب التغير.",
  historySince: "الرصد منذ {{date}}",
  deposits: "الإيداعات",
  withdrawals: "السحوبات",
  opening: "الرصيد الافتتاحي",
  closing: "الرصيد الختامي",
  result: "التغير باستثناء الإيداعات والسحوبات",
  flowsUnknown:
    "لم يتم تأكيد سجل التدفقات. تغير الرصيد لا يساوي عائد الاستثمار.",
  flowComplete: "أكدت التدفقات لهذه التواريخ",
  contribution: "المساهمة في تغير الرصيد",
  allValues: "جميع المبالغ بوحدة USDT",
  completeWallets: "المحافظ المشمولة",
  sourceNote: "مصدر التقييم",
  emptyTitle: "كل أرصدتك معًا",
  emptyBody: "اربط المنصات لمشاهدة الأرصدة والتغيرات والسجل في تطبيق واحد.",
  connect: "ربط منصة",
  tryDemo: "استكشاف العرض التجريبي",
  exitDemo: "الخروج من العرض التجريبي",
  addAccount: "إضافة حساب",
  add: "ربط",
  cancel: "إلغاء",
  close: "إغلاق",
  back: "رجوع",
  name: "اسم الحساب",
  optional: "اختياري",
  apiKey: "مفتاح API",
  secret: "سر API",
  passphrase: "عبارة المرور",
  required: "أكمل الحقول المطلوبة، بما فيها عبارة مرور OKX.",
  instruction:
    "أنشئ مفتاح API مخصصًا للقراءة فقط. عطّل التداول والسحب والتحويلات. تُحفظ المفاتيح على هذا الجهاز.",
  acknowledge: "أنشأت مفتاحًا للقراءة فقط",
  checkConnection: "التحقق والربط",
  checking: "جارٍ التحقق من الأذونات والأرصدة…",
  connected: "تم ربط الحساب",
  unsupportedWeb:
    "المفاتيح الحقيقية مدعومة في تطبيقي iOS وAndroid. إصدار الويب للعرض التجريبي فقط.",
  partialConnection:
    "تم الربط مع تغطية جزئية للمحافظ. افتح الحساب لمراجعة البيانات الناقصة.",
  permissionDeclared:
    "أكدت أذونات المفتاح؛ لا يمكن لهذا الموصل التحقق منها تلقائيًا بعد.",
  remove: "إزالة",
  confirmDelete:
    "هل تريد إزالة الحساب والمفاتيح والسجل المرتبط؟ لن يُلغى المفتاح أو الأوامر على المنصة.",
  retryDelete: "إعادة محاولة الإزالة",
  incompleteSetup: "الإعداد غير مكتمل — أزل الحساب وأعد ربطه",
  deletePending: "الإزالة غير مكتملة — أعد تنظيف المفاتيح",
  saved: "تم الحفظ",
  storageError:
    "تعذّر قراءة البيانات المحمية أو حفظها. لم تُحذف البيانات. أعد المحاولة على جهاز مفتوح.",
  genericError: "فشلت العملية. تحقق من الاتصال وأعد المحاولة.",
  readOnlyRequired:
    "استخدم مفتاحًا للقراءة فقط وعطّل أذونات التداول والسحب والتحويل.",
  missingKeys:
    "المفاتيح مفقودة أو يحتاج الحساب إلى استكمال الإعداد أو الإزالة.",
  exchangeResponse: "رفضت المنصة الطلب. تحقق من المفتاح والأذونات ونوع الحساب.",
  invalidResponse: "استجابة غير متوقعة من المنصة. تم الاحتفاظ بالرصيد السابق.",
  tooManyRequests: "تم بلوغ حد طلبات المنصة. حاول لاحقًا.",
  timeout: "لم تستجب المنصة في الوقت المحدد.",
  coverageOKX: "التغطية: Trading وFunding. منتجات Earn غير مشمولة بعد.",
  coverageBingX: "التغطية: Spot وFutures. منتجات Earn غير مشمولة بعد.",
  unpriced: "لا يوجد سعر مؤكد بوحدة USDT لبعض الأصول.",
  unavailable: "تعذّر تحديث هذه المحفظة.",
  archive: "خطط التداول المؤرشفة",
  migration:
    "أُزيل التداول من التطبيق. تظل الأوامر السابقة فعّالة على المنصات. راجعها هناك واستبدل المفاتيح القديمة بمفاتيح للقراءة فقط.",
  noPlans: "لا توجد خطط مؤرشفة",
  orderIds: "معرّفات الأوامر",
  privacy: "الخصوصية",
  appLock: "طلب مصادقة الجهاز",
  unlock: "فتح AirCapital",
  locked: "أرصدتك محمية",
  authUnavailable: "أعدّ رمز الجهاز أو المصادقة الحيوية أولًا.",
  authFailed: "لم تكتمل المصادقة. حاول مجددًا.",
  export: "تصدير البيانات",
  exportNote:
    "يحتوي التصدير على السجل المالي بصيغة مقروءة، دون مفاتيح API. شاركه مع من تختار فقط.",
  exportAction: "إنشاء تصدير",
  noExport: "لا يوجد سجل محفوظ للتصدير بعد.",
  exported: "التصدير جاهز",
  flows: "الإيداعات والسحوبات",
  addFlow: "تسجيل تدفق نقدي",
  amount: "المبلغ بوحدة USDT",
  occurredAt: "التاريخ والوقت (YYYY-MM-DD HH:mm)",
  flowType: "النوع",
  deposit: "إيداع",
  withdrawal: "سحب",
  save: "حفظ",
  invalidFlow: "أدخل مبلغًا موجبًا وتاريخًا صالحًا غير مستقبلي.",
  confirmFlows: "سجلت جميع تدفقات الفترة",
  confirmFlowsBody:
    "أكد فقط بعد تسجيل جميع الإيداعات والسحوبات لكل حساب محدد بين التاريخين المعروضين، سجل أصل المبلغ نفسه على طرفي التحويلات بين حساباتك، دون الرسوم لكي تبقى الرسوم ضمن النتيجة.",
  flowManual: "مسجل يدويًا",
  noFlows: "لا توجد تدفقات مسجلة",
  noReturn: "سجل التدفقات المؤكد غير كافٍ",
  deleteFlow: "حذف التدفق النقدي",
  noPercent: "النسبة غير متاحة لرصيد افتتاحي صفري أو سالب",
  background:
    "تُحدّث الأرصدة أثناء فتح التطبيق. المراقبة المستمرة في الخلفية غير مفعّلة.",
  securityNote:
    "السجل مشفّر على هذا الجهاز. احتفظ بالتصدير للاستعادة؛ قد تتعذر قراءة البيانات المحلية بعد إعادة التثبيت أو تغيير الجهاز.",
  safety: "الأذونات والتخزين",
  from: "من",
  to: "إلى",
  chooseAccount: "اختر حسابًا",
  unknownWallet: "محفظة غير معروفة",
  privacyUnavailable: "تعذّر تفعيل حماية المعاينة على هذا الجهاز.",
  originalHistory:
    "حُسبت اللقطات السابقة بالطريقة القديمة. وهي محفوظة في التصدير؛ تستخدم الإحصاءات الجديدة الرصد المؤكد.",
};
