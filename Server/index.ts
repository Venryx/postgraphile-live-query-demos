import commander from "commander";
const {program} = commander;
import express from "express";
import postgraphile_ from "postgraphile";
const postgraphile = postgraphile_["postgraphile"] as typeof postgraphile_;
import {LQHelper_Plugin, LQHelper_liveSubscribe, LQHelper_execute} from "./Utils/LQHelper";

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

program
  .option("-v, --variant <type>", "Which server variant to use (base, patches)");

program.parse(process.argv);
export const launchOpts = program.opts();
export const variant = launchOpts.variant;

//if (launchOpts.variant == "base") {

const app = express();

const dbURL = process.env.DATABASE_URL || `postgres://${process.env.PGUSER}:${process.env.PGPASSWORD}@localhost:5432/lq-demos`;
const dbPort = process.env.PORT || 2101 as number;

app.use(
	postgraphile(
		dbURL,
		"app_public",
		{
			watchPg: true,
			graphiql: true,
			enhanceGraphiql: true,
			appendPlugins: [
				require("@graphile-contrib/pg-simplify-inflector"),
				require("@graphile/subscriptions-lds").default,
				require("postgraphile-plugin-connection-filter"),
				variant == "patches" && LQHelper_Plugin,
			],
			dynamicJson: true,
			live: true,
			executeFunc: LQHelper_execute,
			subscribeFunc: LQHelper_liveSubscribe,
			ownerConnectionString: dbURL, // passed in a 2nd time, for live-query module (connection-string with elevated privileges)
			enableCors: true, // cors flag temporary; enables mutations, from any origin
			showErrorStack: true,
			extendedErrors: ["hint", "detail", "errcode"], // to show error text in console (doesn't seem to be working)
		} as any, // temp cast
	)
);

app.listen(dbPort);