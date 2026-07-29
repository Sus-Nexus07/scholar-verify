import { CompiledContract } from '@midnight-ntwrk/midnight-js-protocol/compact-js';
import path from 'node:path';

export {
  Contract,
  ledger,
  pureCircuits,
  type Ledger,
  type ImpureCircuits,
  type PureCircuits,
} from './managed/scholarship-eligibility/contract/index.js';
import { Contract } from './managed/scholarship-eligibility/contract/index.js';
import { witnesses } from './witnesses.js';

const currentDir = path.resolve(new URL(import.meta.url).pathname, '..');
export const zkConfigPath = path.resolve(currentDir, 'managed', 'scholarship-eligibility');

export const CompiledScholarshipContract = CompiledContract.make(
  'ScholarshipEligibilityContract',
  Contract,
).pipe(
  CompiledContract.withWitnesses(witnesses),
  CompiledContract.withCompiledFileAssets(zkConfigPath),
);