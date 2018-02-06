#!/usr/bin/env node
const shell = require("shelljs");
const arg = require("arg");
const axios = require("axios");
const chalk = require("chalk");
const urlRegex = require("url-regex");
const format = require("date-fns/format");
const hnt = require("hnt");
const { toWordsOrdinal } = require("number-to-words");
const fs = require("fs");
const path = require("path");

// define args
const args = arg({
  // Types
  "--path": String, // the path to the directory that you want to deploy
  "--service": String, // the service that you want to deploy with
  "--git-commits": Number, // the number of git commits to include in the update

  // Aliases
  "-p": "--path",
  "-s": "--service",
  "-gc": "--git-commits"
});

// assign to an easier variable and provide defaults
const service = args["--service"] || "now";
const deployPath = args["--path"] || ".";
const numGitCommits = args["--git-commits"];

/**
 * Get the config file and extract the useful variables from it (projectName & teamsUrl)
 * @returns {{ projectName: string, teamsUrl: string, options: object? }}
 */
function getConfig() {
  const cwd = process.cwd();
  const configPath = path.join(cwd, ".teams-notifier-config.json");

  if (fs.existsSync(configPath)) {
    const configFileRaw = fs.readFileSync(configPath, "utf8");

    // try to read the config file
    try {
      const { projectName, teamsUrl, options } = JSON.parse(configFileRaw);

      // make sure the fields that we need are present
      if (!projectName) {
        throw chalk.red("You don't have a projectName field! It is required!");
      }

      if (!teamsUrl) {
        throw chalk.red("You don't have a teamsUrl field! It is required!");
      }

      return { projectName, teamsUrl, options };
    } catch (e) {
      console.log(chalk`
        {red Your config file wasn't able to to be parsed correctly.}
        Please fix it and try again.
        ${e}
      `);
      shell.exit(1);
    }
  } else {
    shell.echo(chalk`
      {red You don't have a config file present!}
      Please create a .config file in the directory where you use this command.
    `);
    shell.exit(1);
  }
}

/**
 * Execute the service deploy and post the notification to teams
 * @param {string} service - the command for the service that you want to use
 * @param {string} deployPath - the path to the files you want to deploy
 * @param {number} numGitCommits - the number of git commits to include in the summary
 * @param {string} projectName - the name of the project you are deploying
 * @param {string} teamsUrl - the teams webhook url where the notification needs to be posted
 * @param {{ themeColor: string? }} options - object with options provided by the user
 */
function execAndPost(
  service,
  deployPath,
  numGitCommits,
  projectName,
  teamsUrl,
  options
) {
  // make sure they have the service installed
  if (shell.which(service)) {
    // execute the command with the service with the provided path
    // also save the value that was outputted to the console by the service
    const { stdout } = shell.exec(
      `${service} ${service === "netlify" ? "deploy" : ""} ${deployPath}`
    );

    // get the specified number of git commits
    const { stdout: rawGitCommits } = shell.exec(
      `git log -n ${numGitCommits} --format="%s"`,
      { silent: true }
    );

    // split the commits by new line (so each commit is its own array entry)
    // filter out undefined or empty items
    const splitGitCommits = rawGitCommits.split("\n").filter(Boolean);

    // generate the commit messages for the action card
    const gitCommitActionCardItems = splitGitCommits.map((commit, i) => {
      const word = toWordsOrdinal(i + 1);
      const capitalizedWord = word.charAt(0).toUpperCase() + word.slice(1);
      return {
        name: i === 0 ? "Latest commit:" : `${capitalizedWord} latest commit:`,
        value: commit
      };
    });

    // get the url from the stdout
    const urlMatches = stdout.match(urlRegex());
    const deployedUrl = urlMatches && urlMatches[0];

    // get date string of the time at which it was uploaded
    const dateString = format(new Date(), "MMM Do h:mma");

    // post the deployment message
    axios
      .post(teamsUrl, {
        "@type": "MessageCard",
        "@context": "http://schema.org/extensions",
        summary: `A new version of the ${projectName} site was deployed to ${deployedUrl}`,
        themeColor: hnt(options, "themeColor", "0075FF"),
        sections: [
          {
            startGroup: true,
            title: `**New ${projectName} site deployed**`,
            facts: [
              { name: "Date/time uploaded:", value: dateString },
              {
                name: "Link:",
                value: `[${deployedUrl}](${deployedUrl})`
              },
              ...gitCommitActionCardItems
            ]
          },
          {
            potentialAction: [
              {
                "@type": "OpenUri",
                name: "View Website",
                targets: [{ os: "default", uri: deployedUrl }]
              }
            ]
          }
        ]
      })
      .then(function(response) {
        console.log(chalk`\n{green Deployment message posted to Teams}`);
      })
      .catch(function(error) {
        console.log(chalk`
          {red Sorry, something went wrong with the notification.}
          Please check your teamsUrl and try again.
          For reference your teams url was {yellow ${teamsUrl}}
        `);
      });
  } else {
    shell.echo(chalk`
      {red Sorry, this script requires ${service}}.
      Please install it before moving forward.
    `);
    shell.exit(1);
  }
}

// kick it off!
const { projectName, teamsUrl, options } = getConfig();
execAndPost(service, deployPath, numGitCommits, projectName, teamsUrl, options);
