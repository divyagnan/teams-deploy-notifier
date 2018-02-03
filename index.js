const shell = require("shelljs");
const arg = require("arg");
const axios = require("axios");
const chalk = require("chalk");
const fs = require("fs");
const path = require("path");

// define args
const args = arg({
  // Types
  "--path": String,
  "--service": String,

  // Aliases
  "-p": "--path",
  "-s": "--service"
});

// assign to an easier variable
// provide defaults
const service = args["--service"] || "now";
const deployPath = args["--path"] || ".";

// get the config file
if (fs.existsSync(path.join(__dirname, ".config"))) {
  const configFileRaw = fs.readFileSync(
    path.join(__dirname, ".config"),
    "utf8"
  );
  const { projectName, teamsUrl } = JSON.parse(configFileRaw);

  // make sure they have the service installed
  if (shell.which(service)) {
    // execute the command with the service with the provided path
    // also save the value that was outputted to the console by the service
    const { stdout } = shell.exec(`${service} ${deployPath}`);
    // post the deployment message
    axios
      .post(teamsUrl, {
        text: `The **${projectName}** site was deployed! See it live here: [${stdout}](${stdout})`
      })
      .then(function(response) {
        console.log("Deployment message posted to Teams");
      })
      .catch(function(error) {
        console.log(error);
      });
  } else {
    shell.echo(chalk`
    {red Sorry, this script requires ${service}}.
    Please install it before moving forward.`);
    shell.exit(1);
  }
} else {
  shell.echo(chalk`
    {red You don't have a config file present!}
    Please create a .config file in the directory where you use this command.`);
  shell.exit(1);
}
