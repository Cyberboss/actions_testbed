// Only check jobs that start with these.
// Helps make sure we don't restart something like which is not known to be flaky.
const CONSIDERED_JOBS = [
	"Windows Live Tests",
	"Linux Live Tests",
	"Build .deb Package"
];

async function getFailedJobsForRun(github) {
	const jobs = await github.paginate(
		github.rest.actions.listJobsForWorkflowRunAttempt,
		{
            owner: "tgstation",
            repo: "tgstation-server",
            run_id: 8775243593,
            attempt_number: 1
		},
		response => {
			return response.data;
		});

    console.log(JSON.stringify(jobs));

	return jobs
		.filter((job) => job.conclusion === "failure");
}

export async function rerunFlakyTests({ github, context }) {
	const failingJobs = await getFailedJobsForRun(
		github
	);

	if (failingJobs.length > 1) {
		console.log("Multiple jobs failing. PROBABLY not flaky, not rerunning.");
		return;
	}

	const filteredFailingJobs = failingJobs.filter((job) => {
		console.log(`Failing job: ${job.name}`)
		return CONSIDERED_JOBS.some((title) => job.name.startsWith(title));
	});
	if (filteredFailingJobs.length === 0) {
		console.log("Failing jobs are NOT designated flaky. Not rerunning.");
		return;
	}

	console.log(`Rerunning job: ${filteredFailingJobs[0].name}`);

	github.rest.actions.reRunWorkflowFailedJobs({
		owner: context.repo.owner,
		repo: context.repo.repo,
		run_id: context.payload.workflow_run.id,
	});
}
