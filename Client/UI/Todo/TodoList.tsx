import {gql, useMutation, useSubscription} from "@apollo/client";
import React, {useState} from "react";
import {Column} from "../../Utils/ReactComponents/Column";
import {Row} from "../../Utils/ReactComponents/Row";
import {TodoEntry} from "./@TodoEntry";

const GET_TODO_ENTRIES = gql`
subscription GET_TODO_ENTRIES {
	todoEntries {
		nodes {
			id
			createdAt
			text
		}
	}
}
`;
const CREATE_TODO_ENTRY = gql`
mutation CREATE_TODO_ENTRY($entry: TodoEntryInput!) {
	createTodoEntry(input: {todoEntry: $entry}) {
		clientMutationId
	}
}
`;
export const UPDATE_TODO_ENTRY = gql`
mutation UPDATE_TODO_ENTRY($id: String!, $patch: TodoEntryPatch!) {
	updateTodoEntry(input: {id: $id, patch: $patch}) {
		todoEntry {
			id
			createdAt
			text
		}
	}
}
`;
const DELETE_TODO_ENTRY = gql`
mutation DELETE_TODO_ENTRY($id: String!) {
	deleteTodoEntry(input: {id: $id}) {
		todoEntry { id }
	}
}
`;

export function TodoList() {
	//const {loading, error, data: {todoEntries: {nodes: entries = []} = {}} = {}} = useSubscription(GET_TODO_ENTRIES);
	const {loading, error, data: data1} = useSubscription(GET_TODO_ENTRIES);
	const [addTodoEntry, {data: data2}] = useMutation(CREATE_TODO_ENTRY);
	const [updateTodoEntry, info] = useMutation(UPDATE_TODO_ENTRY);
	const [deleteTodoEntry, {}] = useMutation(DELETE_TODO_ENTRY);
	let [newEntryText, setNewEntryText] = useState("");
	
	if (loading) return <div>Loading...</div>;
	if (error) return <div>{`Error! ${error.message}`}</div>;
	
	const entries = data1?.todoEntries?.nodes ?? [];
	return (
		<Column style={{width: 300}}>
			<Row>
				<input type="text" value={newEntryText} onChange={e=>{
					setNewEntryText(e.target.value);
				}}/>
				<button onClick={()=>{
					const entry = new TodoEntry({text: newEntryText});
					addTodoEntry({variables: {entry}});
					setNewEntryText("");
				}}>Add</button>
			</Row>
			{entries.map((entry, index)=>{
				return (
					<Row key={index}>
						<span style={{flex: 1}}>{entry.text}</span>
						{/*<button disabled={index == 0} onClick={()=>{
							// todo
						}}>Up</button>
						<button disabled={index == entries.length - 1} onClick={()=>{
							// todo
						}}>Dn</button>*/}
						<button onClick={()=>{
							updateTodoEntry({variables: {
								id: entry.id,
								patch: {
									text: "Random_" + Math.random(),
								},
							}});
						}}>Rnd</button>
						<button onClick={()=>{
							deleteTodoEntry({variables: {id: entry.id}});
						}}>X</button>
					</Row>
				);
			})}
		</Column>
	);
}