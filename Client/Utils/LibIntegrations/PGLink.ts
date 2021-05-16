import {ApolloClient, ApolloLink, FetchResult, from, HttpLink, InMemoryCache, NormalizedCacheObject, Observable, Operation, split} from "@apollo/client";
import {onError} from "@apollo/client/link/error";
import {WebSocketLink} from "@apollo/client/link/ws";
import {getMainDefinition} from "@apollo/client/utilities";
import {createApplyLiveQueryPatch} from "@n1ru4l/graphql-live-query-patch";
import {print} from "graphql";
import {GetTypePolicyFieldsMappingSingleDocQueriesToCache} from "mobx-graphlink";
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
		const applyLiveQueryPatch = createApplyLiveQueryPatch();
		const queue = [];
		const iter: AsyncIterableIterator<Record<string, unknown>> = {
			async* [Symbol.asyncIterator]() {
				while (true) {
					yield queue[0];
				}
		 	},
			next() { return queue[0]; }
		};
		const applyIter = applyLiveQueryPatch(iter);
		
		return new Observable<FetchResult>(sink=>{
			const baseObservable = this.baseLink.request(operation);
			let subresultsReceived = 0;
			baseObservable.subscribe(async subresult=>{
				subresultsReceived++;

				queue.length = 0;
				queue[0] = subresult;
				const nextSubresultOut = (await applyIter.next()).value;
				sink.next(nextSubresultOut);

				console.log(`Subresult(${subresultsReceived}):`, subresult, "SubresultOut:", nextSubresultOut);
			});
		});
	}
}