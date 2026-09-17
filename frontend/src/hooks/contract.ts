// Owner: Apurva — shared contract descriptor for every hook.
import { DONATION_PLATFORM_ABI, DONATION_PLATFORM_ADDRESS } from '../config/contract';
import { TARGET_CHAIN } from '../config/wagmi';

export const platformContract = {
  address: DONATION_PLATFORM_ADDRESS,
  abi: DONATION_PLATFORM_ABI,
  chainId: TARGET_CHAIN.id,
} as const;

export const REFETCH_MS = 8_000;
