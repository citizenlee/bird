import type { Command } from 'commander';
import type { CliContext } from '../cli/shared.js';
import { TwitterClient } from '../lib/twitter-client.js';
import { normalizeHandle } from '../lib/normalize-handle.js';

export function registerFollowCommand(program: Command, ctx: CliContext): void {
  program
    .command('follow')
    .description('Follow one or more users')
    .argument('<user-id-or-handle...>', 'User IDs or @handles to follow')
    .option('--json', 'Output as JSON')
    .action(async (userIdOrHandles: string[], cmdOpts: { json?: boolean }) => {
      const opts = program.opts();
      const timeoutMs = ctx.resolveTimeoutFromOptions(opts);

      const { cookies, warnings } = await ctx.resolveCredentialsFromOptions(opts);

      for (const warning of warnings) {
        console.error(`${ctx.p('warn')}${warning}`);
      }

      if (!cookies.authToken || !cookies.ct0) {
        console.error(`${ctx.p('err')}Missing required credentials`);
        process.exit(1);
      }

      const client = new TwitterClient({ cookies, timeoutMs });
      const results: Array<{ input: string; userId?: string; success: boolean; error?: string }> = [];
      let failures = 0;

      for (const input of userIdOrHandles) {
        // Check if input looks like a user ID (all digits) or a handle
        const isUserId = /^\d+$/.test(input);
        let userId: string;
        let displayName = input;

        if (isUserId) {
          userId = input;
        } else {
          // It's a handle - we need to look up the user ID
          const handle = normalizeHandle(input);
          if (!handle) {
            failures += 1;
            results.push({ input, success: false, error: 'Invalid handle format' });
            if (!cmdOpts.json) {
              console.error(`${ctx.p('err')}Invalid handle: ${input}`);
            }
            continue;
          }
          displayName = `@${handle}`;

          // Use the user lookup to get the ID
          const lookupResult = await client.getUserIdByUsername(handle);
          if (!lookupResult.success || !lookupResult.userId) {
            failures += 1;
            const error = lookupResult.error ?? 'User not found';
            results.push({ input: displayName, success: false, error });
            if (!cmdOpts.json) {
              console.error(`${ctx.p('err')}Failed to find user ${displayName}: ${error}`);
            }
            continue;
          }
          userId = lookupResult.userId;
        }

        const result = await client.followUser(userId);
        if (result.success) {
          results.push({ input: displayName, userId, success: true });
          if (!cmdOpts.json) {
            console.log(`${ctx.p('ok')}Followed ${displayName}${isUserId ? '' : ` (ID: ${userId})`}`);
          }
        } else {
          failures += 1;
          results.push({ input: displayName, userId, success: false, error: result.error });
          if (!cmdOpts.json) {
            console.error(`${ctx.p('err')}Failed to follow ${displayName}: ${result.error}`);
          }
        }

        // Small delay between follows to avoid rate limiting
        if (userIdOrHandles.length > 1) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }

      if (cmdOpts.json) {
        console.log(JSON.stringify({ results, failures }, null, 2));
      }

      if (failures > 0) {
        process.exit(1);
      }
    });
}
