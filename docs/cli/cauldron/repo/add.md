## `ern cauldron repo add`

#### Description

- Add a Cauldron repository to the local collection of Cauldron repositories

#### Syntax

`ern cauldron repo add <alias> <url>`

**Arguments**

`<alias>`

- Alias to associate to the cauldron repository.

`<url>`

- Local or remote url to the Cauldron git repository to add.
- A remote url can be the HTTPS or SSH url to the Cauldron git repository (SSH recommended).
- A local url can be any valid path to a local directory (empty directory or containing a git repository).
- For HTTPS urls, the username and password (or token) must be specified in the URL (valid formats are `https://[username]:[password]@[repourl` or `https://[token]@[repourl]`).
- By default, the `master` branch of the repository will be used. If you need to use a different branch, you can set the branch name you want to use, by appending it at the end of the url using the `#[branch-name]` format (second example below illustrate this).

**Options**

- `--current true|false`

  - Set the repository as the active repository after adding it to the collection of repositories.
  - If this option is not provided, you are prompted to choose if you want to set the repository as the active repository.

- `--force/-f true|false`

  Overwrite an existing alias with the same name

**Example**

`ern cauldron repo add my-cauldron git@github.com:username/my-cauldron.git`  
Add a new Cauldron repository, with alias `my-cauldron`, and url `git@github.com:username/my-cauldron.git`, to the local collection of Cauldron repositories. The branch that will be used for this Cauldron will be `master` as no branch was explicitly specified.

`ern cauldron repo add my-local-cauldron ~/path/to/local/cauldron`  
Add a new Cauldron repository with alias `my-local-cauldron` and url pointing to local directory `~/path/to/local/cauldron` to the location collection of Cauldron repositories.

`ern cauldron repo add my-other-cauldron git@github.com:username/other-cauldron#development --current`  
Add a new Cauldron repository, with alias `my-other-cauldron`, and url `git@github.com:username/other-cauldron`, to the local collection of Cauldron repositories and set it at the current activated Cauldron. The branch that will be used for this Cauldron will be `development` as it was explicitly specified in the Cauldron url.

`ern cauldron repo add -f my-local-cauldron ~/path/to/local/cauldron`\
Adds the `my-local-cauldron` alias, and overwrites it if it already exists.

#### Remarks

- If the `alias` already exists, this command will fail, unless `--force/-f` is used.
