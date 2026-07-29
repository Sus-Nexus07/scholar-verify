export type ScholarshipPrivateState = {
  income: bigint;
};

export const witnesses = {
  getIncome: (context: { privateState: ScholarshipPrivateState }): [ScholarshipPrivateState, bigint] => {
    return [context.privateState, context.privateState.income];
  },
};