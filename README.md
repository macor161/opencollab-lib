# OpenCollab Library

`opencollab-lib` is a library port of [opencollab-cli](https://github.com/yondonfu/opencollab-cli). It can be used in any NodeJs or Electron app.

# Install

Two dependencies are currently needed to use `opencollab-lib`: [TestRPC](https://github.com/ethereumjs/testrpc) for testing purpose and [git-mango-helper](https://github.com/macor161/git-mango-helper) to handle the `mango://` protocol. Then run `npm install`.

```
npm install -g ethereumjs-testrpc git-mango-helper
npm install
```


# Usage

Make sure `TestRPC` is running. Gas usage has not been addressed so it is likely necessary to run TestRPC with a high gas limit.

```
testrpc -l 1000000000
```

# Testing

First, make sure that `TestRPC` is running:

```
testrpc -l 1000000000
```

And since the library currently use babel to transpile its code, be sure to run `npm run build` before starting the tests:

```
npm run build
npm test
```

# State of the Library

Below is a list of opencollab functionalities and their current state.

| Command               | State | Tests |
| ----------------------|:-----:|:-----:|
| init                  |   ‎✔   |  ‎✔    |
| status                |   ‎✔   |  ✔    |
| issues                |   ✔   |  ✔    |
| get-issue             |   ✔   | WIP   |
| new-issue             |   ✔   | WIP   |
| edit-issue            |   x   |  x    |
| delete-issue          |   x   |  x    |
| fork                  |   x   |  x    |
| merge-fork            |   x   |  x    |
| pull-requests         |   x   |  x    |
| get-pull-request      |   x   |  x    |
| open-pull-request     |   x   |  x    |
| close-pull-request    |   x   |  x    |
| maintainers           |   x   |  x    |
| add-maintainer        |   x   |  x    |
| remove-maintainer     |   x   |  x    |
| set-obsolete          |   x   |  x    |       

