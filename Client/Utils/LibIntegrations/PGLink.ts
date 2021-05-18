import {ApolloClient, ApolloLink, FetchResult, from, HttpLink, InMemoryCache, NormalizedCacheObject, Observable, Operation, split} from "@apollo/client";
import {onError} from "@apollo/client/link/error";
import {WebSocketLink} from "@apollo/client/link/ws";
import {getMainDefinition} from "@apollo/client/utilities";
import {GetTypePolicyFieldsMappingSingleDocQueriesToCache} from "mobx-graphlink";
import {ApplyPatchesLink} from "@pg-lq/apollo-plugin";

const GRAPHQL_URL = "http://localhost:2101/graphql";

export let pgClient: ApolloClient<NormalizedCacheObject>;
export function InitPGLink() {
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
	
	pgClient = new ApolloClient({
		link: new ApplyPatchesLink(link_withErrorHandling),
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