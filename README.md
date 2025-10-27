# semver-bump-micro
A GitHub Action that automatically increments the micro (patch) version of a semantic version number stored in a standalone file.

The name is no longer quite accurate – it can also be used to bump the minor and major versions (see [WORKFLOWS](WORKFLOWS.md)).

## About semantic versioning
Semantic versioning is a three-number version numbering scheme. eg the version:

```
  1.2.3456
```

indicates:
- major version 1
- minor version 2
- micro version 3456

Major versions are typically incremented on breaking releases (or potentially for marketing reasons), minor versions for each complete new feature, and micro versions for each change in the codebase.

When the minor version is incremented, the micro resets to 0. When the major is incremented, both micro and minor reset to 0.

It gives an indication of how far apart two versions are, eg when considering compatibility or an upgrade.

## Overview of `semver-bump-micro`
This action maintains a semantic version in GitHub by incrementing the micro version on each push to `main` (actually to any branch you choose).

It is inspired by the work of - [PaulHatch/semantic-version](https://github.com/PaulHatch/semantic-version) and [yoichiro/gh-action-increment-value](https://github.com/yoichiro/gh-action-increment-value). However those two don't quite meet my needs. I want a semantic version rather than a simple counter, but I don't want to put content in my commit messages to manage it.

`semver-bump-micro` increments only the micro version. I've taken the view that this is the one that needs frequent automatic updating. Minor and major versions can be managed manually and intentionally.

It's designed to increment on pushes to main, not to count every commit. Incrementing on push strikes a good balance between automation and simplicity, while:
1. reliably providing a simple, always-increasing version number for every available code version;
2. indicating how far apart two versions are.

The semantic version is maintained in a version file that:
- contains **only** a valid semantic version number
- can be named anything and kept anywhere in your repository

This action reads the semantic version number, increments the micro version and writes it back to the file.

The supplied workflow (below) checks out your codebase, calls the action and commits the change. It is triggered on push to `main` (or any branch or branches you choose).

## Usage
### Basic workflow
Place this workflow in your `.github/workflows` directory.
eg `.github/workflows/bump-micro.yml`.

```yaml
name: Bump Version
on:
  push:
    # select any branch you choose
    branches: [main]
    # Prevent recursion
    paths-ignore: ['path/name/version_file']
  # allow the workflow to be triggered manually (default branch only)
  workflow_dispatch:

# increments must be sequential, not concurrent
concurrency:
  group: version-bump-${{ github.ref }}
  cancel-in-progress: false

# allow the workflow to push commits
permissions:
  contents: write

jobs:
  bump-version:
    runs-on: ubuntu-latest
    # set your target directory and file
    # note this doesn't work for `paths-ignore` above
    env:
      TARGET_DIR: location/of/version/file/in/your/repo
      TARGET_FILE: version_file_name
    steps:
      - name: Checkout code
        uses: actions/checkout@v5
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          # this fetches the full version history
          # otherwise the `git commit --amend --no-edit` step below risks flattening your repository history
          fetch-depth: 0
          # the branch to check out
          ref: main
      
      - name: Bump version
        uses: guystrelitz/semver-bump-micro@v1.1.0
        with:
          target_directory: ${{ env.TARGET_DIR }}
          target_file: ${{ env.TARGET_FILE }}
      
      # `git commit --amend --no-edit` adds the version bump to the previous commit, ie keeps the version change with the code that it relates to
      # a simpler `git commit -m` would create a separate commit for the version bump
      - name: Commit and push
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          git add ${{ env.TARGET_DIR }}/${{ env.TARGET_FILE }}
          git commit --amend --no-edit
          git push --force-with-lease
```

#### Workflow configuration guide
In the workflow file the following settings are required:

| Setting             | Description                           |
|---------------------|---------------------------------------|
| `TARGET_FILE`       | Name of the version file              |
| `TARGET_DIR`        | Directory containing the version file |
| `paths-ignore`      | Concatenation of `TARGET_DIR/TARGET_FILE`<br>Due to workflow file syntax this has to be set separately |
| `branches`          | The branch on which pushes will cause the workflow to run |
| `ref`               | The branch to check out and commit. Obviously this should be the same as `branches`! |
| `workflow_dispatch` | You can omit this line if you don't want a 'Run workflow' button in GitHub.     |

**⚠️ Do not remove `fetch-depth: 0`**. If you do so and retain `git commit --amend --no-edit`, the action is liable to flatten your entire history in GitHub. The next `git pull` will then flatten it on your development machine. Your history may well become unrecoverable.

### Advanced usage – bumping minor and major versions
As of tag v1.1.0 `semver-bump-micro` can also bump minor and major versions. See [WORKFLOWS](WORKFLOWS.md) for suitable workflows for these more advanced cases.

## Version file format
The version file must contain **exactly** a semantic version number with no additional content.

The action is tolerant of a trailing line ending (both Unix \n and Windows \r\n), and will strip it when writing the new version.

### ✅ Valid formats:
- `1.2.3`
- `0.0.0`
- `10.20.30`

### ❌ Invalid formats:
- `1.2           # missing patch version`
- `1.2.3.4       # too many parts`
- `v1.2.3        # has prefix`
- `1.2.3-beta    # has suffix`
- `  1.2.3       # has whitespace`
- `1.2.3         # has additional content`<br>`other text`

## Limitations
- **Manual edits break automation**: If users manually edit the version file, it will cause conflicts with the automated version bumping
- **Single version file only**: This action only handles one version file per workflow run
- **`git pull`:** Even in solo development you will have to run `git pull` before each `git push origin`, because the version file and commit hash will have changed on origin in GitHub
- **Increments on push to `main`, not for each commit**: The action focuses on push events rather than individual commits, which provides a useful level of versioning granularity.

## Development
### Running tests
```bash
npm test
```

### Test coverage
The action includes tests covering:
- Valid version formats
- Invalid version formats  
- Line ending tolerance
- Console output behavior
- Error handling

## License
MIT License. See [LICENSE](LICENSE) file for details.

## Contributing
Contributions are welcome! Please feel free to submit issues and pull requests. If submitting a pull request, please be sure to include tests for all new behaviour.
