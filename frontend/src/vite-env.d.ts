/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_RPC_URL?: string;
  readonly VITE_API_URL?: string;
  readonly VITE_USE_MOCK?: string;
  readonly VITE_IPFS_GATEWAY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
