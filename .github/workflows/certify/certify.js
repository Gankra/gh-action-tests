const core = require('@actions/core');
const github = require('@actions/github');
const exec = require('@actions/exec');

const main = async () => {
  try {
    // Get the JSON webhook payload for the event that triggered the workflow
    const payload = JSON.stringify(github.context.payload, undefined, 2)
    console.log(`The event payload: ${payload}`);

    const protoCerts = core.getInput('audits');
    console.log(`certs given: ${protoCerts}`);
    // Setup github/octokit stuff
    const { context = {} } = github;
    const { pull_request } = context.payload;

    const GITHUB_TOKEN = core.getInput('GITHUB_TOKEN');
    const octokit = github.getOctokit(GITHUB_TOKEN);

    // TODO: actually load this from the context somehow?
    const certs = [
      {
        "author": "Aria Beingessner <a.beingessner@gmail.com>",
        "package": "serde",
        "version1": "1.0.0",
        "notes": "Wow cool audit!",
        "criteria": [
          "safe-to-run"
        ],
        "dependency_criteria": []
      },
      {
        "author": "Aria Beingessner <a.beingessner@gmail.com>",
        "package": "serde_derive",
        "version1": "1.1.0",
        "version2": "1.2.0",
        "notes": "Wow cool audit2!",
        "criteria": [
          "safe-to-deploy",
          "safe-to-run"
        ],
        "dependency_criteria": []
      }
    ];

    console.log("certifying...");
    // Apply the certifies!
    for (const cert of certs) {
      // We're certifying...
      const cmd = "cargo";
      let args = ["vet", "certify"];

      // Add various metadata
      for (const criteria of cert.criteria) {
          args.push("--criteria",  criteria);
      }
      for (const dependency_criteria of cert.dependency_criteria) {
          console.log("dependency_criteria not yet supported!");
      }

      args.push("--who", cert.author);
      args.push("--notes", cert.notes);
      // No prompts, the author already signed off!
      args.push("--accept-all");
      // Don't bother checking if the package/version makes sense?
      args.push("--force");

      // Now add the position package/version info
      args.push(cert.package);
      args.push(cert.version1);
      if (cert.version2) {
          args.push(cert.version2);
      }

      await exec.exec(cmd, args);
    }

    // Now create a commit!
    /*
    await octokit.issues.createComment({
      ...context.repo,
      issue_number: pull_request.number,
      body: 'Thank you for submitting a pull request! We will try to review this as soon as we can.'
    });
    */

    /*
    octokit.rest.git.createCommit({
          owner,
      repo,
      message,
      tree,
      author.name,
      author.email
      })
    */
    await exec.exec("git", "diff");
  } catch (error) {
    core.setFailed(error.message);
  }
}

main();
