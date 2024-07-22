import type { ChangelogFunctions } from '@changesets/types';
import { getInfo, getInfoFromPullRequest } from '@changesets/get-github-info';

export default {
  async getDependencyReleaseLine(changeset, dependenciesUpdated, options) {
    return 'TODO'
  },

  async getReleaseLine(changeset, type, options) {
    return 'TODO'
  }
} satisfies ChangelogFunctions;
