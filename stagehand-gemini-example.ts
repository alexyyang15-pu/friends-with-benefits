import { Stagehand } from "@browserbasehq/stagehand";
import { z } from "zod";

async function main() {
	const stagehand = new Stagehand({
		/**
		 * With npx create-browser-app, this config is found 
		 * in a separate stagehand.config.ts file
		*/
		env: "LOCAL",
		modelName: "google/gemini-2.0-flash",
		modelClientOptions: {
			apiKey: process.env.GEMINI_API_KEY,
		},
	});
	await stagehand.init();

	const page = stagehand.page;

	await page.goto("https://www.google.com");
	await page.act("Type in 'Browserbase' into the search bar");

	const { title } = await page.extract({
		instruction: "The title of the first search result",
		schema: z.object({
			title: z.string(),
		}),
	});
	
	console.log("First search result title:", title);

	await stagehand.close();
}

main().catch(console.error); 