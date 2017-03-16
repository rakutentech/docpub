# Contributing

New contributions are welcomed. Follow this guide if you want to make one.

## Make a pull request

Follow [Github guide](https://help.github.com/articles/creating-a-pull-request) to fork a repo and create a pull request.

All bug fixes and new features should go to the [`master`](https://github.com/rakutentech/docpub/tree/master) branch.

## Commit messages

Commit messages should follow [conventional changelog standard](https://github.com/bcoe/conventional-changelog-standard/blob/master/convention.md).

## Code style and static analysis

Before submitting pull request, make sure your code passes all code style and static analysis checks.
To do so, run:

```
npm run lint
```

## Tests

Make sure all tests are passing before submitting pull request:

```
npm test
```

If you are fixing the bug, add a test that fails without your patch and passes with it. If you are adding a feature, write a test for it. To see test coverage report run:

```
npm test --coverage
```

## Issues reporting

When submitting an issue please do following:

1. [Search](https://github.com/rakutentech/docpub/issues) for same issues on github in order to prevent duplicates
2. Fill as many sections as possible described in [issue template](https://github.com/gemini-testing/gemini/blob/master/ISSUE_TEMPLATE.md) so we will additional info to work with

Note that if no response for contributors questions will be provided in 1 week then issue may be considered as irrelevant/resolved and may be closed.
