// Snowpack Configuration File
// See all supported options: https://www.snowpack.dev/reference/configuration

const forProd = process.env.NODE_ENV == "production";

/** @type {import("snowpack").SnowpackUserConfig } */
module.exports = {
	//root: "src",
	/*mount: {
	  "./": {url: "/"},
	},*/
	exclude: [
		`./Scripts/**/*`,
		`./Build/**/*`,
		`./*.json`,
		`./*.js`
	].map(a => a.replace("./", __dirname.replace(/\\/g, "/") + "/")),
	workspaceRoot: process.env.NPM_LINK_ROOT, // needed so that same-version changes to linked-module files aren't ignored (both for dev-server and prod-builds)
	plugins: [
		/*[
		  '@snowpack/plugin-webpack',
		  {
			 outputPattern: {css: "../../Build/webpack/css/[name].[contenthash].css", js: "../../Build/webpack/js/[name].[contenthash].js", assets: "../../Build/webpack/assets/[name].[contenthash].[ext]"}
		  },
		],*/
	],
	packageOptions: {
		external: [
			//"fast-json-patch"
			//"jsondiffpatch",
			//"@apollo/client",
		].concat(forProd ? ['react-vextensions', 'react-vcomponents'] : [])
	},
	devOptions: {
		open: "none",
	},
	buildOptions: {
		out: "Build/esm"
	},
};