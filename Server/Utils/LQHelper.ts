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
export default function(builder) {
	builder.hook("GraphQLObjectType:fields:field", (field, build, context)=>{
		const {pgSql: sql} = build;
		const { scope: { isRootQuery, isRootSubscription, fieldName }, addArgDataGenerator } = context;

		const isMatch = (isRootQuery || isRootSubscription) && fieldName == "todoEntries"
		if (!isMatch) {
			// The 'GraphQLObjectType:fields:field' hook runs for every field on
			// every object type in the schema. If it's not a field in the root
			// mutation type, or the field isn't named 'createLink', we don't want
			// to modify it in this hook - so return the input object unmodified.
			return field;
		}

		// We're going to need link.id for our `performAnotherTask`; so we're going
		// to abuse addArgDataGenerator to make sure that this field is ALWAYS
		// requested, even if the user doesn't specify it. We're careful to alias
		// the result to a field that begins with `__` as that's forbidden by
		// GraphQL and thus cannot clash with a user's fields.
		addArgDataGenerator(() => ({
			pgQuery: queryBuilder => {
			queryBuilder.select(
				// Select this value from the result of the INSERT:
				sql.query`${queryBuilder.getTableAlias()}.id`,
				// And give it this name in the result data:
				"__createdRecordId"
			);
			},
		}));

		// It's possible that `resolve` isn't specified on a field, so in that case
		// we fall back to a default resolver.
		const defaultResolver = obj => obj[fieldName];

		// Extract the old resolver from `field`
		const { resolve: oldResolve = defaultResolver, ...rest } = field;

		return {
			// Copy over everything except 'resolve'
			...rest,

			// Add our new resolver which wraps the old resolver
			async resolve(...resolveParams) {
				const [source, args, gqlContext, resolveInfo] = resolveParams;

				// Perform some validation (or any other action you want to do before
				// calling the old resolver)
				/*const RESOLVE_ARGS_INDEX = 1;
				const {
					input: {
						link: { title },
					},
				} = resolveParams[RESOLVE_ARGS_INDEX];
				if (title.length < 3) {
					throw new Error("Title is too short!");
				}*/

				// Call the old resolver (you SHOULD NOT modify the arguments it
				// receives unless you also manipulate the AST it gets passed as the
				// 4th argument; which is quite a lot of effort) and store the result.
				const oldResolveResult = await oldResolve(...resolveParams);

				// custom section
				// ==========

				console.log(`Query. Info:`, {
					field, build, context,
					source, args, gqlContext, resolveInfo,
				});

				/*global["_lastClientID"] ??= 1;
				gqlContext._clientID ??= ++global["_lastClientID"];*/
				//gqlContext._clientID ??= global["_lastClientID"] = (global["_lastClientID"]|0) + 1;
				//gqlContext._clientID ??= global["_lastClientID"] = (global["_lastClientID"]|0) + 1;
				if (gqlContext._clientID == null) {
					gqlContext._clientID = global["_lastClientID"] = (global["_lastClientID"]|0) + 1;
					const patchGenerator = createLiveQueryPatchGenerator();
					gqlContext._patchGenerator_queue = [];
					gqlContext._patchGenerator_queue[Symbol.asyncIterator] = function*() {
						while (true) {
							const nextEntry = gqlContext._patchGenerator_queue[0];
							yield {...nextEntry, isLive: true};
						}
					};
					gqlContext._patchGenerator_call = patchGenerator(gqlContext._patchGenerator_queue)
				}
				console.log("Client ID:", gqlContext._clientID);

				//if (_resolveInfo.parentType.name == "Subscription") {
				//if (_resolveInfo.operation.operation == "subscription") {
				if (true) {
					//console.log("\nOp:", _resolveInfo.operation);
					console.log(`Result:`, oldResolveResult, "isAsyncIter:", isAsyncIterable(oldResolveResult));

					/*if (isAsyncIterable(result)) {
						const resultAsPatch = gqlContext._makePatch(result);
						console.log(`FullResult:`, result, "ResultAsPatch:", resultAsPatch);
						return resultAsPatch;
					}
					return result;*/

					//gqlContext._patchGenerator_queue.length = 0;
					gqlContext._patchGenerator_queue[0] = oldResolveResult;
					const resultAsPatch = (await gqlContext._patchGenerator_call.next()).value;

					// if empty patch, it means client is just re-requesting the full/orig list, so return that
					if (resultAsPatch.patch && resultAsPatch.patch.length == 0) {
						return oldResolveResult;
					}

					// if data field is null (ie. result is actually a patch, not the initial results)
					if (resultAsPatch.data == null) {
						debugger;
						resultAsPatch.data = []; // add an empty "data" prop, else PgTablesPlugin.js errors
					}

					console.log(`FullResult:`, oldResolveResult, "ResultAsPatch:", resultAsPatch);
					return resultAsPatch;
				}

				// Finally return the result.
				return oldResolveResult;
			},
		};
	});
}

const isAsyncIterable = (value: unknown): value is AsyncIterable<unknown> => {
	return (
		typeof value === "object" && value !== null && Symbol.asyncIterator in value
	);
};