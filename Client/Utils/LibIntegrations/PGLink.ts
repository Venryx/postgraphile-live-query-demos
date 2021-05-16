import {ApolloClient, ApolloLink, FetchResult, from, HttpLink, InMemoryCache, NormalizedCacheObject, Observable, Operation, split} from "@apollo/client";
import {onError} from "@apollo/client/link/error";
import {WebSocketLink} from "@apollo/client/link/ws";
import {getMainDefinition} from "@apollo/client/utilities";
import {createApplyLiveQueryPatch} from "@n1ru4l/graphql-live-query-patch";
import {print} from "graphql";
import {GetTypePolicyFieldsMappingSingleDocQueriesToCache} from "mobx-graphlink";
//import { applyAsyncIterableIteratorToSink } from "@n1ru4l/push-pull-async-iterable-iterator";
import { SubscriptionServer } from "subscriptions-transport-ws";

const GRAPHQL_URL = "http://localhost:2101/graphql";

export let pgClient: ApolloClient<NormalizedCacheObject>;
export function InitPGLink() {
	pgClient = new ApolloClient({
		link: new CustomApolloLink(),
		cache: new InMemoryCache({
			typePolicies: {
				Query: {
					fields: {
						...GetTypePolicyFieldsMappingSingleDocQueriesToCache(),
					},
				},
			},
		}),
	});
}

class CustomApolloLink extends ApolloLink {
	constructor() {
		super();
		
		const httpLink = new HttpLink({
			uri: GRAPHQL_URL,
		});
		const wsLink = new WebSocketLink({
			uri: GRAPHQL_URL.replace(/^http/, "ws"),
			options: {
				reconnect: true,
			},
		});
	
		// using the ability to split links, you can send data to each link depending on what kind of operation is being sent
		const link = split(
			// split based on operation type
			({query})=>{
				const definition = getMainDefinition(query);
				return definition.kind === "OperationDefinition" && definition.operation === "subscription";
			},
			wsLink,
			httpLink,
		);
		const link_withErrorHandling = from([
			onError(({graphQLErrors, networkError})=>{
				if (graphQLErrors) {
					graphQLErrors.forEach(({message, locations, path})=>{
						console.error(`[GraphQL error]: Message:`, message, `Location:`, locations, `Path:`, path.toString());
					});
				}
	
				if (networkError) console.error(`[Network error]:`, networkError);
			}),
			link,
		]);
		this.baseLink = link_withErrorHandling;
	}
	baseLink: ApolloLink;

	public request(operation: Operation): Observable<FetchResult> | null {
		/*const definition = getMainDefinition(operation.query);
		const isSubscription = definition.kind === "OperationDefinition" && definition.operation === "subscription";*/

		const applyLiveQueryPatch = createApplyLiveQueryPatch();
		return new Observable<FetchResult>((sink) =>{
			/*const result = this.baseLink.request({
				operationName: operation.operationName,
				operation: print(operation.query),
				variables: operation.variables,
			});*/
			const result = this.baseLink.request(operation);
			const result_patched = applyLiveQueryPatch(result);
			return applyAsyncIterableIteratorToSink(result, sink);
		});
	}
}