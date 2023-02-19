# vite-plugin-ssam-git

The purpose of `vite-plugin-ssam-git` is to help [Ssam](https://github.com/cdaein/ssam) canvas wrapper and helper create a code and image snapshot at the same time when working on creative coding sketches. Having both snapshots makes it easy to archive and retrieve the work from a particular moment. It may also be used more generally by leveraging the server-client communication.

> ⚠️ This module is early in its development. Expect breaking changes to come.

## Install

```sh
npm i -D vite-plugin-ssam-git
```

## How it works

When the plugin is run, it first checks whether `git` is available on the machine and then checks for whether the project directory is already a git repo or not. If it's not, it will run `git init` to create a new one.

When `ssam:git` message is sent to the plugin from a client, the plugin commits to the Git and sends back `ssam:git-success` message to the client with the commit hash. Ssam then uses this info to export an image with the hash. The plugin sends `ssam:log` message when git commit is successful, and it sends `ssam:warn` for errors.

## How to use

> If you're using Ssam with `npm create ssam`, this plugin is already set up for you. No need to do anything below.

In your code:

```js
// attach it to a keyboard listener or button, etc.
if (import.meta.hot) {
  import.meta.hot.send("ssam:git", {
    commitMessage: "some message",
    // you can include extra data
    id: 1234,
  });
}

if (import.meta.hot) {
  import.meta.hot.on("ssam:git-success", (data) => {
    // do something with the git commit hash
    saveFile(`${data.hash}.png`);
    // you get back extra data you sent earlier
    console.log(data.id);
  });

  import.meta.hot.on("ssam:log", (data) => {
    console.log(data.msg);
  });

  import.meta.hot.on("ssam:warn", (data) => {
    console.warn(data.msg);
  });
}
```

## Minimum Example

If you want to use this plugin in your own setup, here is a bare minimum example:

In `vite.config.js`:

```js
import { defineConfig } from "vite";
import { ssamGit } from "vite-plugin-ssam-git";

export default defineConfig({
  plugins: [ssamGit()],
  // ..
});
```

In your module code:

```js
const canvas = document.createElement("canvas");
canvas.width = canvas.height = 200;
document.body.appendChild(canvas);
const ctx = canvas.getContext("2d");

ctx.fillStyle = `gray`;
ctx.fillRect(0, 0, 200, 200);

window.addEventListener("keydown", (ev) => {
  if (ev.key === "k") {
    if (import.meta.hot) {
      import.meta.hot.send("ssam:git", {
        commitMessage: "my commit",
      });
    }
  }
});

if (import.meta.hot) {
  import.meta.hot.on("ssam:git-success", (data) =>
    // do something with hash
    console.log(`commit hash:${data.hash}`)
    // if you have some function to save a canvas...
    saveCanvas(canvas, { filename: `${data.hash}.png` })
  );
  import.meta.hot.on("ssam:log", (data) => console.log(data.msg));
  import.meta.hot.on("ssam:warn", (data) => console.warn(data.msg));
}

export {};
```

## Default Options

```js
ssamGit({
  // console logging in browser
  log: true,
});
```

## License

MIT
