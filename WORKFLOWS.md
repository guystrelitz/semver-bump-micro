# Workflow Examples
This document provides example workflows for manually bumping major and minor semantic versions with a custom commit message.

For the basic workflow to bump the micro version, an explanation of the architecture and more, see the [README](/).

## Bump minor workflow
Place this workflow in your `.github/workflows` directory, eg as `.github/workflows/bump-minor.yml`.
```yaml
name: Bump Minor Version
on:
  workflow_dispatch:
    inputs:
      commit_message:
        description: 'Commit message'
        required: true
        type: string

# prevent mutual concurrency with all version workflows
concurrency:
  group: version-bump-${{ github.ref }}
  cancel-in-progress: false

permissions:
  contents: write

jobs:
  bump-minor:
    runs-on: ubuntu-latest
    env:
      TARGET_DIR: location/of/version/file/in/your/repo
      TARGET_FILE: version_file_name
    steps:
      - name: Checkout code
        uses: actions/checkout@v5
        with:
          sparse-checkout: |
            ${{ env.TARGET_DIR }}/${{ env.TARGET_FILE }}
          token: ${{ secrets.GITHUB_TOKEN }}
          fetch-depth: 1
      
      - name: Bump minor version
        uses: guystrelitz/semver-bump-micro@v1.1.0
        with:
          target_directory: ${{ env.TARGET_DIR }}
          target_file: ${{ env.TARGET_FILE }}
          bump_type: bump_minor
      
      - name: Commit and push
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          git add ${{ env.TARGET_DIR }}/${{ env.TARGET_FILE }}
          git commit -m "${{ inputs.commit_message }}"
          git push
```

### Configuration

| Setting                 | Description                           |
|-------------------------|---------------------------------------|
| `TARGET_DIR`            | Directory containing the version file |
| `TARGET_FILE`           | Name of the version file              |
| `bump_type: bump_minor` | Specifies minor version increment     |

### Differences from the micro workflow
- Runs manually via workflow dispatch
- Creates a regular commit, separate from the code change, which in turn requires and enables
  - Requires the user to provide a commit message, captured in the `commit_message` input.
  - Uses sparse checkout for efficiency
  - Shallow checkout (`fetch-depth: 1`)

## Bump major version workflow
Place this workflow in your `.github/workflows` directory, eg as `.github/workflows/bump-major.yml`.
```yaml
name: Bump Major Version
on:
  workflow_dispatch:
    inputs:
      commit_message:
        description: 'Commit message'
        required: true
        type: string
      confirm_major:
        description: Major version should only be incremented for breaking changes or major marketing releases. Please confirm that this is the case.
        required: false
        type: boolean
        default: false

# prevent mutual concurrency with all version workflows
concurrency:
  group: version-bump-${{ github.ref }}
  cancel-in-progress: false

permissions:
  contents: write

jobs:
  cancel-if-unconfirmed:
    runs-on: ubuntu-latest
    if: inputs.confirm_major == false
    steps:
      - name: Confirmation required
        run: |
          echo "❌ Major version bump cancelled. User did not confirm appropriate major change."
          exit 1

  bump-major:
    runs-on: ubuntu-latest
    if: inputs.confirm_major
    env:
      TARGET_DIR: location/of/version/file/in/your/repo
      TARGET_FILE: version_file_name
    steps:
      - name: Checkout code
        uses: actions/checkout@v5
        with:
          sparse-checkout: |
            ${{ env.TARGET_DIR }}/${{ env.TARGET_FILE }}
          token: ${{ secrets.GITHUB_TOKEN }}
          fetch-depth: 1
      
      - name: Bump major version
        uses: guystrelitz/semver-bump-micro@v1.1.0
        with:
          target_directory: ${{ env.TARGET_DIR }}
          target_file: ${{ env.TARGET_FILE }}
          bump_type: bump_major
      
      - name: Commit and push
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          git add ${{ env.TARGET_DIR }}/${{ env.TARGET_FILE }}
          git commit -m "${{ inputs.commit_message }}"
          git push
```

### Configuration

| Setting                 | Description                           |
|-------------------------|---------------------------------------|
| `TARGET_DIR`            | Directory containing the version file |
| `TARGET_FILE`           | Name of the version file              |
| `bump_type: bump_major` | Specifies major version increment     |

### Differences from the minor workflow
This workflow features a confirmation checkbox that the user really does intend a major version bump. The `bump-major` job, which calls the action, is processed only if the confirmation is checked. If it is not checked, the `cancel-if-unconfirmed` job runs instead, cancelling the workflow with an error message.

You can easily remove the checkbox and this processing if you prefer.

## Usage
1. Go to the **Actions** tab in GitHub
2. Select the workflow (e.g., "Bump Minor Version")
3. Click the **Run workflow ▾** button/dropdown
4. Select the branch to run on (defaults to your default branch)
5. Provide the required commit message
6. For the major workflow, check the confirmation checkbox
7. Click the **Run workflow** button

The workflow will create a new commit with the bumped version number and push it to the branch.

