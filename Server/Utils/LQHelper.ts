import PGUtils from "graphile-utils";
import graphql, {DocumentNode, ExecutionResult, GraphQLFieldResolver, GraphQLObjectType, GraphQLSchema} from "graphql";
import {Context, mixed} from "postgraphile";
import graphql_live_query_patch from "@n1ru4l/graphql-live-query-patch";
//import "fast-json-patch";
const {makeWrapResolversPlugin} = PGUtils;
const {execute, createSourceEventStream, GraphQLError} = graphql;
const {createLiveQueryPatchGenerator, createApplyLiveQueryPatchGenerator} = graphql_live_query_patch;
import mapAsyncIterator_ from "postgraphile/build/postgraphile/http/mapAsyncIterator.js";
const mapAsyncIterator = mapAsyncIterator_["default"];

export function LQHelper_Plugin(builder) {
}

const isAsyncIterable = (value: unknown): value is AsyncIterable<unknown> => {
	return (
		typeof value === "object" && value !== null && Symbol.asyncIterator in value
	);
};

export function LQHelper_liveSubscribe(
	argsOrSchema: any | GraphQLSchema,
	document?: DocumentNode,
	rootValue?: any,
	contextValue?: any,
	variableValues?: {[key: string]: any},
	operationName?: string,
	fieldResolver?: GraphQLFieldResolver<any, any>,
	subscribeFieldResolver?: GraphQLFieldResolver<any, any>
) {
	/* eslint-enable no-redeclare */
	// Extract arguments from object args if provided.
	return arguments.length === 1
		? liveSubscribeImpl(
			argsOrSchema.schema,
			argsOrSchema.document,
			argsOrSchema.rootValue,
			argsOrSchema.contextValue,
			argsOrSchema.variableValues,
			argsOrSchema.operationName,
			argsOrSchema.fieldResolver,
			argsOrSchema.subscribeFieldResolver,
		)
		: liveSubscribeImpl(
			argsOrSchema,
			document as DocumentNode,
			rootValue,
			contextValue,
			variableValues,
			operationName,
			fieldResolver,
			subscribeFieldResolver,
		);
}

function liveSubscribeImpl(
	schema: GraphQLSchema,
	document: DocumentNode,
	rootValue?: any,
	contextValue?: any,
	variableValues?: {[key: string]: any},
	operationName?: string,
	fieldResolver?: GraphQLFieldResolver<any, any>,
	subscribeFieldResolver?: GraphQLFieldResolver<any, any>,
) {
	const sourcePromise = createSourceEventStream(schema, document, rootValue, contextValue, variableValues, operationName, subscribeFieldResolver);

	// For each payload yielded from a subscription, map it over the normal
	// GraphQL `execute` function, with `payload` as the rootValue.
	// This implements the "MapSourceToResponseEvent" algorithm described in
	// the GraphQL specification. The `execute` function provides the
	// "ExecuteSubscriptionEvent" algorithm, as it is nearly identical to the
	// "ExecuteQuery" algorithm, for which `execute` is also used.
	const mapSourceToResponse = async (payload: any) => {
		/*
		 * GRAPHILE FORK
		 *
		 * We need to tell Graphile Engine when the execution has completed
		 * (because we cannot detect this from inside the GraphQL execution) so
		 * that it can clean up old listeners; we do this with the `finally` block.
		 */
		try {
			let result = execute(schema, document, payload, contextValue, variableValues, operationName, fieldResolver);

			/*console.log("==========");
			for (let obj of [schema, document, rootValue, contextValue, variableValues, operationName, subscribeFieldResolver]) {
				if (obj == null || typeof obj != "object") {
					console.log("SeenCount:n/a");
					continue;
				}
				obj.seenCount = (obj.seenCount | 0) + 1;
				console.log("SeenCount:", obj.seenCount);
			}*/
			if (contextValue._clientID == null) {
				contextValue._clientID = global["_lastClientID"] = (global["_lastClientID"]|0) + 1;
				//contextValue.applyLiveQueryPatchGenerator = createApplyLiveQueryPatchGenerator();
				const patchGenerator = createLiveQueryPatchGenerator();
				contextValue._patchGenerator_queue = [];
				contextValue._patchGenerator_queue[Symbol.asyncIterator] = function*() {
					while (true) {
						const nextEntry = contextValue._patchGenerator_queue[0];
						yield {...nextEntry, isLive: true};
					}
				};
				contextValue._patchGenerator_call = patchGenerator(contextValue._patchGenerator_queue)
			}
			console.log("Client ID:", contextValue._clientID);

			//result = applyLiveQueryPatchGenerator(result);
			let result_awaited = await result;
			
			//result_awaited = contextValue.applyLiveQueryPatchGenerator(result_awaited) as typeof result_awaited;
			//contextValue._patchGenerator_queue.length = 0;
			contextValue._patchGenerator_queue[0] = result_awaited;
			const resultAsPatch = (await contextValue._patchGenerator_call.next()).value;
			result_awaited = resultAsPatch;

			return result_awaited;
		} finally {
			if (payload && typeof payload.release === 'function') {
				payload.release();
			}
		}
	};

	// Resolve the Source Stream, then map every source value to a
	// ExecutionResult value as described above.
	return sourcePromise.then(
		resultOrStream =>
			// Note: Flow can't refine isAsyncIterable, so explicit casts are used.
			isAsyncIterable(resultOrStream)
				? mapAsyncIterator(
					(resultOrStream as any) as AsyncIterable<mixed>,
					mapSourceToResponse,
					reportGraphQLError,
				)
				: ((resultOrStream as any) as ExecutionResult),
		reportGraphQLError,
	);
}

/*export function LQHelper_execute(schema, document, payload, contextValue, variableValues, operationName, fieldResolver) {
	let result = execute(schema, document, payload, contextValue, variableValues, operationName, fieldResolver);

	const applyLiveQueryPatchGenerator = createApplyLiveQueryPatchGenerator();
	if (result instanceof Promise) {
		return result.then(result_awaited=>{
			result_awaited = applyLiveQueryPatchGenerator(result_awaited) as typeof result_awaited;
			return result_awaited;
		});
	}

	return applyLiveQueryPatchGenerator(result) as typeof result;
}*/

/**
* This function checks if the error is a GraphQLError. If it is, report it as
* an ExecutionResult, containing only errors and no data. Otherwise treat the
* error as a system-class error and re-throw it.
*/
function reportGraphQLError(error: any) {
	if (error instanceof GraphQLError) {
		return {errors: [error]};
	}
	throw error;
}
