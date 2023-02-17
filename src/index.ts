/**
 * ssam git commit snapshot
 *
 * - ssam: CMD+K
 *   - sends a ssam:git message to Vite dev server.
 *   - include { canvasId, filename }
 * - vite: receive the message
 *   - check if git is already init'ed
 *     - if not, send message to ssam with error (console log it in both places)
 *   - git add . && git commit with { filename }
 *   - get commit hash
 *   - send back success message and { canvasId, hash } to ssam
 * - ssam:
 *   - if commit success, exportFrame and log message
 */

import { ViteDevServer } from "vite";
import { exec } from "child_process";
import kleur from "kleur";
import ansiRegex from "ansi-regex";

type Options = {
  log?: boolean;
};

const defaultOptions = {
  log: true,
};

const { gray, green, yellow } = kleur;

const execPromise = (cmd: string) => {
  return new Promise((resolve, reject) => {
    exec(cmd, (err, stdout, stderr) => {
      if (err) {
        reject(stderr);
      }
      resolve(stdout);
    });
  });
};

const prefix = () => {
  return `${gray(new Date().toLocaleTimeString())} ${green(`[ssam-git]`)}`;
};

const removeAnsiEscapeCodes = (str: string) => {
  return str.replace(ansiRegex(), "");
};

export const ssamGit = (opts?: Options) => ({
  name: "ssam-git",
  configureServer(server: ViteDevServer) {
    const log = opts?.log || defaultOptions.log;

    server.ws.on("ssam:git", (data, client) => {
      // 1. check if "git init"ed
      execPromise(`git status --porcelain`)
        .then(() => {
          // 2. add all changes and commit
          // REVIEW: can commit message contain its own hash?
          // TODO: also, what if data.commitMessage is not available? provide a fallback (current date/time)
          return execPromise(
            `git add . && git commit -am "${data.commitMessage}"`
          );
        })
        .then((value) => {
          {
            // 3. log git commit message
            const msg = `${prefix()} ${value}`;
            log && client.send("ssam:log", { msg: removeAnsiEscapeCodes(msg) });
            console.log(`${prefix()} ${value}`);
          }

          return execPromise(`git rev-parse --short HEAD`);
        })
        .then((hash) => {
          {
            // 4. send commit hash back to ssam
            client.send("ssam:git-success", {
              ...data,
              hash: (hash as string).trim(),
            });
          }
        })
        .catch((err) => {
          if (!err) {
            // err is empty so create a custom one
            // REVIEW: empty check is enough? or look at "git diff" length?
            const msg = `${prefix()} nothing to commit, working tree clean`;
            log &&
              client.send("ssam:warn", { msg: removeAnsiEscapeCodes(msg) });
            console.warn(`${msg}`);
          } else {
            const msg = `${prefix()} ${err}`;
            log &&
              client.send("ssam:warn", { msg: removeAnsiEscapeCodes(msg) });
            console.error(`${prefix()} ${yellow(`${err}`)}`);
          }
        });
    });
  },
});
