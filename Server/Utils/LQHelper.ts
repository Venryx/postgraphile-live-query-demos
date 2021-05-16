import PGUtils from "graphile-utils";
import {GraphQLObjectType} from "graphql";
import {Context} from "postgraphile";
import {createLiveQueryPatchGenerator} from "@n1ru4l/graphql-live-query-patch";
import "fast-json-patch";
const {makeWrapResolversPlugin} = PGUtils;

/*export default makeWrapResolversPlugin({
	TodoEntry: {
		//email: {
		async resolve(resolver, user, args, context, _resolveInfo) {
			console.log("Hit Test1");
			return "Test1";
		},
	},
});*/
// Example: log before and after each mutation runs
export default makeWrapResolversPlugin(
	context => {
		//if (context.scope.isRootMutation) {
		if (context.scope.isRootQuery) {
			return {scope: context.scope};
		}
		return null;
	},
	({scope}) => async (resolver, user, args, context, _resolveInfo) => {
		const result = await resolver(user, args, context, _resolveInfo);

		/*global["_lastClientID"] ??= 1;
		context._clientID ??= ++global["_lastClientID"];*/
		//context._clientID ??= global["_lastClientID"] = (global["_lastClientID"]|0) + 1;
		//context._clientID ??= global["_lastClientID"] = (global["_lastClientID"]|0) + 1;
		if (context._clientID == null) {
			context._clientID = global["_lastClientID"] = (global["_lastClientID"]|0) + 1;
			const patchGenerator = createLiveQueryPatchGenerator();
			context._patchGenerator_queue = [];
			context._patchGenerator_queue[Symbol.asyncIterator] = function*() {
				while (true) {
					const nextEntry = context._patchGenerator_queue[0];
					yield {...nextEntry, isLive: true};
				}
			};
			context._patchGenerator_call = patchGenerator(context._patchGenerator_queue)
		}
		console.log("Client ID:", context._clientID);

		//console.log(`Query. Info:`, {resolver, user, args, context, _resolveInfo});
		/* [example log for subscription op]
			{ [...]
				_resolveInfo: { [...]
					rootValue: {
						liveAbort: [Function: liveAbort],
						counter: 0,
						liveCollection: [Function: bound liveCollection],
						liveRecord: [Function: bound liveRecord],
						liveConditions: [],
						release: [Function: release]
					},
					operation: {
						kind: 'OperationDefinition',
						operation: 'subscription',
						name: { kind: 'Name', value: 'GET_TODO_ENTRIES', loc: [Object] },
						variableDefinitions: [],
						directives: [],
						selectionSet: { kind: 'SelectionSet', selections: [Array], loc: [Object] },
						loc: { start: 0, end: 139 }
					}, [...]
				} [...]
			}
		*/
		
		//if (_resolveInfo.parentType.name == "Subscription") {
		if (_resolveInfo.operation.operation == "subscription") {
			//console.log("\nOp:", _resolveInfo.operation);
			console.log(`Result:`, result, "isAsyncIter:", isAsyncIterable(result));

			/*if (isAsyncIterable(result)) {
				const resultAsPatch = context._makePatch(result);
				console.log(`FullResult:`, result, "ResultAsPatch:", resultAsPatch);
				return resultAsPatch;
			}
			return result;*/

			//context._patchGenerator_queue.length = 0;
			context._patchGenerator_queue[0] = result;
			const resultAsPatch = (await context._patchGenerator_call.next()).value;

			// if data field is null (ie. result is actually a patch, not the initial results)
			if (resultAsPatch.data == null) {
				debugger;
				resultAsPatch.data = []; // add an empty "data" prop, else PgTablesPlugin.js errors
			}

			console.log(`FullResult:`, result, "ResultAsPatch:", resultAsPatch);
			return resultAsPatch;
		}
		return result;
	}
);

const isAsyncIterable = (value: unknown): value is AsyncIterable<unknown> => {
	return (
		typeof value === "object" && value !== null && Symbol.asyncIterator in value
	);
};