import { CompiledContract } from '@midnight-ntwrk/midnight-js-protocol/compact-js';
import {
  Contract,
  ledger,
  pureCircuits,
} from '../contracts/managed/scholarship-eligibility/contract/index.js';
import { witnesses } from '../contracts/witnesses.js';

export { Contract, ledger, pureCircuits };

const browserZkConfigPath = '/contract/collection';

export const CompiledScholarshipContractBrowser = CompiledContract.make(
  'ScholarshipEligibilityContractBrowser',
  Contract,
).pipe(
  CompiledContract.withWitnesses(witnesses),
  CompiledContract.withCompiledFileAssets(browserZkConfigPath),
);