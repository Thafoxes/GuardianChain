/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_NETWORK: string
  readonly VITE_CONTRACT_ADDRESS_REWARD_TOKEN: string
  readonly VITE_CONTRACT_ADDRESS_USER_VERIFICATION: string
  readonly VITE_CONTRACT_ADDRESS_REPORT_CONTRACT: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
