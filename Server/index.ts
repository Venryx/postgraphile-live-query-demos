import commander from "commander";
const {program} = commander;
import express from "express";
import postgraphile_ from "postgraphile";
const postgraphile = postgraphile_["postgraphile"] as typeof postgraphile_;

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

program
  .option("-v, --variant <type>", "Which server variant to use (base, patches)");

program.parse(process.argv);
export const launchOpts = program.opts();

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
			],
			dynamicJson: true,
			live: true,
			ownerConnectionString: dbURL, // passed in a 2nd time, for live-query module (connection-string with elevated privileges)
			enableCors: true, // cors flag temporary; enables mutations, from any origin
			showErrorStack: true,
			extendedErrors: ["hint", "detail", "errcode"], // to show error text in console (doesn't seem to be working)
		}
	)
);

app.listen(dbPort);