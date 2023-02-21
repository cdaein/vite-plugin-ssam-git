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

import type { PluginOption, ViteDevServer } from "vite";
import { exec } from "node:child_process";
import fs from "node:fs";
import kleur from "kleur";
import ansiRegex from "ansi-regex";

type Options = {
  /** console logging in browser */
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
        return;
      }
      resolve(stdout);
    });
  });
};

export const formatDatetime = (date: Date) => {
  const isoString = date.toISOString();
  const [, yyyy, mo, dd, hh, mm, ss] = isoString.match(
    /(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/
  )!;
  return `${yyyy}.${mo}.${dd}-${hh}.${mm}.${ss}`;
};

const prefix = () => {
  return `${gray(new Date().toLocaleTimeString())} ${green(`[ssam-git]`)}`;
};

const removeAnsiEscapeCodes = (str: string) => {
  return str.replace(ansiRegex(), "");
};

export const ssamGit = (opts: Options = {}): PluginOption => ({
  name: "vite-plugin-ssam-git",
  apply: "serve", // works only in development
  configureServer(server: ViteDevServer) {
    const { log } = Object.assign(defaultOptions, opts);

    // check if git is available on client machine
    execPromise(`git --version`)
      .catch((err) => {
        const msg = `${prefix()} git is not found: \n${yellow(`${err}`)}`;
        server.ws.send("ssam:warn", { msg: removeAnsiEscapeCodes(msg) });
        console.error(msg);
      })
      .then(() => {
        // if git is not initialized, initialize
        if (!fs.existsSync("./.git")) {
          execPromise(`git init`).then(() => {
            const msg = `${prefix()} git is initialized`;
            server.ws.send("ssam:log", { msg: removeAnsiEscapeCodes(msg) });
            console.log(msg);
          });
        }
      });

    server.ws.on("ssam:git", (data, client) => {
      // 1. check if "git init"ed
      execPromise(`git status --porcelain`)
        .then(() => {
          // 2. add all changes and commit
          // REVIEW: can commit message contain its own hash?
          // TODO: also, what if data.commitMessage is not available? provide a fallback (current date/time)
          return execPromise(`git add .`);
        })
        .then(() => {
          // do not use unsanitized user input
          return execPromise(`git commit -am "${formatDatetime(new Date())}"`);
        })
        .then((result) => {
          {
            // 3. log git commit message
            const msg = `${prefix()} ${result}`;
            log && client.send("ssam:log", { msg: removeAnsiEscapeCodes(msg) });
            console.log(`${prefix()} ${result}`);
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
