# teams-deploy-notifier [![npm version](https://badge.fury.io/js/teams-deploy-notifier.svg)](https://badge.fury.io/js/teams-deploy-notifier)

> CLI tool to notify your colleagues on MS Teams that you've deployed something

## Installation

```
npm install -g teams-deploy-notifier
```

## Usage

1. Create a `.teams-notifier-config.json` file in the root directory of your project. It should look similar to this:

```json
{
  "projectName": "REQUIRED: the name of your project",
  "teamsUrl": "REQUIRED: your ms teams webhook url",
  "options": {
    "themeColor": "OPTIONAL: hex code for your color without the #"
  }
}
```

2. When you are ready to deploy call the cli and optionally pass in the service, path, and git-commit options:

`--service`: the name of the service that you want to deploy with. Examples include [now](https://zeit.co/now) and [netlify](https://www.netlify.com). This defaults to [now](https://zeit.co/now).

`--path`: the path to the directory that you want to deploy. For example if you want to deploy the build directory you might pass in `build` if you wanted to deploy the current directory you might pass in `.`. This defaults to `.`.

`--git-commit`: how many git commit summaries you want to include in the notification. This includes the last n commits in the notification where n is the number you pass in. For example if you wanted only the latest commit you would pass in `1`. If you wanted the last 5 commits you would pass in `5`. If you do not want to include any commits in the notification then omit this argument (by default no commits are included in teh notification).

```bash
teams-deploy-notifier --service now --path build
```

3. Thats it! On successful deploy and notification you will see the info from your service provider printed to the console as well as a green message saying `Deployment message posted to Teams`

## API

#### CLI `teams-deploy-notifier`

```json
  // Available Arguments
  // the path to the directory that you want to deploy. defaults to now
  "--path": String,
  // the service that you want to deploy with. defaults to the current directory (.)
  "--service": String,
  // the last n git commits to include in the notification. commits omitted from notification if number not specified
  "--git-commit": Number,

  // Aliases
  "-p": "--path",
  "-s": "--service",
  "-gc": "--git-commit"
```

Example with `now`:

```bash
teams-deploy-notifier --service now --path build --git-commit 5
# same as
teams-deploy-notifier -s now -p build -gc 5
```

Example with `netlify`:

```bash
teams-deploy-notifier --service netlify --path build --git-commit 5
# same as
teams-deploy-notifier -s netlify -p build -gc 5
```

If you do not pass in any arguments:

```bash
teams-deploy-notifier
# same as
teams-deploy-notifier --service now --path .
# notice that no commits will be included in the notification if you don't specify a number
```

#### Config File (`.teams-notifier-config.json`)

```json
{
  "projectName": "REQUIRED: the name of your project",
  "teamsUrl": "REQUIRED: your ms teams webhook url",
  "options": {
    "themeColor": "OPTIONAL: hex code for your color without the #"
  }
}
```

Simple Example:

```json
{
  "projectName": "Simple Sample Project",
  "teamsUrl": "https://outlook.office.com/webhook/xxx"
}
```

Configured Example:

```json
{
  "projectName": "Configured Sample Project",
  "teamsUrl": "https://outlook.office.com/webhook/xxx",
  "options": {
    "themeColor": "4834d4"
  }
}
```

## Supported Services

The following services have been tested with `teams-deploy-notifier` and are confirmed to work.

* [ZEIT now](https://zeit.co/now)
  * Should work with no additional configuration
* [Netlify](https://www.netlify.com)
  * Need to have a `.netlify` config file before attempting deployment

## FAQ

* How do I obtain a MS Teams incoming webhook url
  * Select the `...` button on channel where you want the notifications
  * Select the `Connectors` option
  * Search for `Incoming Webhook`
  * Select the configure button for the Incoming Webhook option
  * Provide a name and optionally an image and then select create
  * Copy the provided url and paste it into your config (`teams-notifier-config.json`) file
  * See this https://docs.microsoft.com/en-us/microsoftteams/platform/concepts/connectors#setting-up-a-custom-incoming-webhook for more information

## License

MIT © Divyagnan Kandala
