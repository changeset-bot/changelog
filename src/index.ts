import type { ChangelogFunctions } from '@changesets/types';
import { getInfo, getInfoFromPullRequest } from '@changesets/get-github-info';

export default {
  async getDependencyReleaseLine(changeset, dependenciesUpdated) {
    if(dependenciesUpdated.length === 0) {
      return '';
    }

    return '- Updated internal dependencies:\n' + dependenciesUpdated.map(
      (dependency) => `  - ${dependency.name}@${dependency.newVersion}`
    ).join('\n');
  },

  async getReleaseLine(changeset, type, options) {
    const repo = process.env.GITHUB_REPOSITORY;

    if(!repo) {
      throw new Error("Missing env GITHUB_REPOSITORY");
    }

    let prFromSummary: number | undefined;
    let commitFromSummary: string | undefined;
    let usersFromSummary: string[] = [];

    const replacedChangelog = changeset.summary
      .replace(/^\s*(?:pr|pull|pull\s+request):\s*#?(\d+)/im, (_, pr) => {
        let num = Number(pr);
        if (!isNaN(num)) prFromSummary = num;
        return "";
      })
      .replace(/^\s*commit:\s*([^\s]+)/im, (_, commit) => {
        commitFromSummary = commit;
        return "";
      })
      .replace(/^\s*(?:author|user):\s*@?([^\s]+)/gim, (_, user) => {
        usersFromSummary.push(user);
        return "";
      })
      .trim();

    const [firstLine, ...otherLines] = replacedChangelog
      .split("\n")
      .map((l) => l.trimRight());

    const links = await (async () => {
      if (prFromSummary !== undefined) {
        let { links } = await getInfoFromPullRequest({
          repo,
          pull: prFromSummary,
        });
        if (commitFromSummary) {
          const shortCommitId = commitFromSummary.slice(0, 7);
          links = {
            ...links,
            commit: `[\`${shortCommitId}\`](https://github.com/${repo}/commit/${commitFromSummary})`,
          };
        }
        return links;
      }
      const commitToFetchFrom = commitFromSummary || changeset.commit;
      if (commitToFetchFrom) {
        let { links } = await getInfo({
          repo: repo,
          commit: commitToFetchFrom,
        });
        return links;
      }
      return {
        commit: null,
        pull: null,
        user: null,
      };
    })();

    const users = usersFromSummary.length
      ? usersFromSummary
          .map(
            (userFromSummary) =>
              `[@${userFromSummary}](https://github.com/${userFromSummary})`
          )
          .join(", ")
      : links.user;

    const info = [
      links.pull ?? links.commit,
      users && `by ${users}`,
    ].filter(Boolean).join(" ");

    return `- ${firstLine}${info ? ` (${info})` : ''}${otherLines.map((l) => `\n  ${l}`).join('')}`;
  }
} satisfies ChangelogFunctions;
