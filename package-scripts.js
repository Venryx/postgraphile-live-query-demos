/*const serverVariantPaths = {
	base: "./Server/Build/esm/Variants/Base.js",
	patches: "./Server/Build/esm/Variants/WithJSONPatches.js",
};*/
function GetStartServerCommand(variantName) {
	/*const variantPath = serverVariantPaths[server];
	return `node ${variantPath}`;*/
	return `node ./Server/Build/esm/index.js --variant ${variantName}`;
}

const scripts = {};
module.exports.scripts = scripts;

Object.assign(scripts, {
	// setup
	initDB: "psql -f ./Scripts/InitDB.sql lq-demos",

	// first terminal
	front: {
		dev: "cd Client && snowpack dev",
	},
	back: {
		dev: "cd Server && snowpack build --watch",
	},
	dev: `concurrently --kill-others --names fr,ba "npm start front.dev" "npm start back.dev"`,
	
	// second terminal
	server: {
		"todo": {
			base: GetStartServerCommand("base"),
			patches: GetStartServerCommand("patches"),
		},
	},
});