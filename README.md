# vite-plugin-ssam-git

The purpose of `vite-plugin-ssam-git` is to help [Ssam](https://github.com/cdaein/ssam) canvas wrapper and helper create a code and image snapshot at the same time when working on creative coding sketches. Having both snapshots makes it easy to archive and retrieve the work from a particular moment. It may also be used more generally by leveraging the server-client communication.

## How it works

When `ssam:git` message is sent to the plugin from a client, the plugin commits to the Git and sends back `ssam:git-success` message to the client with the commit hash. Ssam then uses this info to export an image with the hash. The plugin sends `ssam:log` message when git commit is successful, and it sends `ssam:warn` for errors.

## Example usage

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

## License

MIT
