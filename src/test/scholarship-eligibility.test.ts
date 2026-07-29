import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { WebSocket } from 'ws';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import {
  deployContract,
  submitCallTx,
  type DeployedContract,
} from '@midnight-ntwrk/midnight-js-contracts';
import type { ContractAddress } from '@midnight-ntwrk/midnight-js-protocol/compact-runtime';
import {
  type EnvironmentConfiguration,
  waitForFunds,
} from '@midnight-ntwrk/testkit-js';
import pino from 'pino';

import { getConfig } from '../config.js';
import {
  MidnightWalletProvider,
  syncWallet,
  type WalletSecret,
} from '../wallet.js';
import { buildProviders, type ScholarshipProviders } from '../providers.js';
import {
  CompiledScholarshipContract,
  Contract,
  ledger,
  zkConfigPath,
} from '../../contracts/index.js';
import type { ScholarshipPrivateState } from '../../contracts/witnesses.js';

// Required for GraphQL subscriptions in Node.js
// @ts-expect-error WebSocket global assignment for apollo
globalThis.WebSocket = WebSocket;

process.on('unhandledRejection', (reason, promise) => {
  console.error('UNHANDLED REJECTION:', reason);
  console.error('Promise:', promise);
});

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
});

const ALICE_LOCAL_SEED =
  '0000000000000000000000000000000000000000000000000000000000000001';
const PRIVATE_STATE_ID = 'AliceScholarshipState';

const logger = pino({
  level: process.env['LOG_LEVEL'] ?? 'info',
  transport: { target: 'pino-pretty' },
});

const network = process.env['MIDNIGHT_NETWORK'] ?? 'local';

function resolveSecret(net: string): WalletSecret {
  if (net === 'local') return { kind: 'seed', value: ALICE_LOCAL_SEED };

  const upper = net.toUpperCase();
  const mnemonicEnv = `MIDNIGHT_${upper}_MNEMONIC`;
  const seedEnv = `MIDNIGHT_${upper}_SEED`;
  const mnemonic = process.env[mnemonicEnv]?.trim().replace(/\s+/g, ' ');
  const seedHex = process.env[seedEnv]?.trim();

  if (mnemonic && seedHex) {
    throw new Error(
      `Set only one of ${mnemonicEnv} or ${seedEnv} (both are defined).`,
    );
  }
  if (mnemonic) {
    return { kind: 'mnemonic', value: mnemonic };
  }
  if (seedHex) {
    if (!/^[0-9a-fA-F]+$/.test(seedHex) || seedHex.length % 2 !== 0) {
      throw new Error(
        `${seedEnv} must be a hex string of even length (no 0x prefix).`,
      );
    }
    return { kind: 'seed', value: seedHex };
  }
  throw new Error(
    `Either ${mnemonicEnv} or ${seedEnv} is required for network '${net}'. ` +
      `Set one in .env.${net} or the shell.`,
  );
}

describe(`Scholarship Eligibility Contract (${network})`, () => {
  let wallet: MidnightWalletProvider;
  let providers: ScholarshipProviders;

  const config = getConfig();
  const secret = resolveSecret(network);
  const isRemote = network !== 'local';
  const syncTimeoutMs = Number(
    process.env['MIDNIGHT_SYNC_TIMEOUT_MS'] ??
      (isRemote ? 60 * 60_000 : 10 * 60_000),
  );

  async function queryLedger(p: ScholarshipProviders, contractAddress: ContractAddress) {
    const state = await p.publicDataProvider.queryContractState(contractAddress);
    expect(state).not.toBeNull();
    return ledger(state!.data);
  }

  async function deployWithIncome(income: bigint, stateId: string) {
    const initialPrivateState: ScholarshipPrivateState = { income };
    const deployed: DeployedContract<Contract> =
      await (deployContract<Contract>)(providers, {
        compiledContract: CompiledScholarshipContract,
        privateStateId: stateId,
        initialPrivateState,
      });
    return deployed.deployTxData.public.contractAddress;
  }

  beforeAll(async () => {
    setNetworkId(config.networkId);

    const envConfig: EnvironmentConfiguration = {
      walletNetworkId: config.networkId,
      networkId: config.networkId,
      indexer: config.indexer,
      indexerWS: config.indexerWS,
      node: config.node,
      nodeWS: config.nodeWS,
      faucet: config.faucet,
      proofServer: config.proofServer,
    };

    wallet = await MidnightWalletProvider.build(logger, envConfig, secret);
    await wallet.start();
    await syncWallet(logger, wallet.wallet, syncTimeoutMs);

    if (isRemote) {
      const nightBalance = await waitForFunds(
        wallet.wallet,
        envConfig,
        false,
        wallet.unshieldedKeystore,
      );
      logger.info(`Wallet NIGHT balance on '${network}': ${nightBalance}`);
    }

    providers = buildProviders(wallet, zkConfigPath, config);
    logger.info(`Providers initialized on '${network}'. Ready to test!`);
  });

  afterAll(async () => {
    if (wallet) {
      logger.info('Stopping wallet...');
      await wallet.stop();
    }
  });

  it('deploys the contract and marks a qualifying applicant as eligible', async () => {
    const threshold = 1_000_000n;
    const programId = new Uint8Array(32).fill(1);
    const contractAddress = await deployWithIncome(650_000n, PRIVATE_STATE_ID + '-qualify');
    logger.info(`Contract deployed at: ${contractAddress}`);
    expect(contractAddress).toBeDefined();

    await (submitCallTx<Contract, 'checkEligibility'>)(providers, {
      compiledContract: CompiledScholarshipContract,
      contractAddress,
      privateStateId: PRIVATE_STATE_ID + '-qualify',
      circuitId: 'checkEligibility',
      args: [threshold, programId],
    });

    const state = await queryLedger(providers, contractAddress);
    expect(state.eligible).toEqual(true);
  });

  it('marks a non-qualifying applicant as ineligible', async () => {
    const threshold = 1_000_000n;
    const programId = new Uint8Array(32).fill(1);
    const contractAddress = await deployWithIncome(1_200_000n, PRIVATE_STATE_ID + '-reject');

    await (submitCallTx<Contract, 'checkEligibility'>)(providers, {
      compiledContract: CompiledScholarshipContract,
      contractAddress,
      privateStateId: PRIVATE_STATE_ID + '-reject',
      circuitId: 'checkEligibility',
      args: [threshold, programId],
    });

    const state = await queryLedger(providers, contractAddress);
    expect(state.eligible).toEqual(false);
  });

  it('never exposes the raw income value in public ledger state', async () => {
    const threshold = 1_000_000n;
    const programId = new Uint8Array(32).fill(1);
    const contractAddress = await deployWithIncome(650_000n, PRIVATE_STATE_ID + '-privacy');

    await (submitCallTx<Contract, 'checkEligibility'>)(providers, {
      compiledContract: CompiledScholarshipContract,
      contractAddress,
      privateStateId: PRIVATE_STATE_ID + '-privacy',
      circuitId: 'checkEligibility',
      args: [threshold, programId],
    });

    const state = await queryLedger(providers, contractAddress);
    const stateKeys = Object.keys(state);
    expect(stateKeys).not.toContain('income');
    expect(JSON.stringify(state)).not.toContain('650000');
  });
});