import {gql, useMutation, useSubscription} from "@apollo/client";
import React, {useState} from "react";
import {Column} from "../../Utils/ReactComponents/Column";
import {Row} from "../../Utils/ReactComponents/Row";
import {TodoEntry} from "./@TodoEntry";

const GET_TODO_ENTRIES = gql`
	query GET_TODO_ENTRIES {
		todoEntries {
			id
			createdAt
			text
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

export function TodoList() {
	const { loading, error, data: entries } = useSubscription(GET_TODO_ENTRIES);
	if (loading) return <div>Loading...</div>;
	if (error) return <div>{`Error! ${error.message}`}</div>;

	const [addTodoEntry, { data }] = useMutation(CREATE_TODO_ENTRY);

	let [newEntryText, setNewEntryText] = useState("");
	
	return (
		<Column>
			<Row>
				<input type="text" value={newEntryText} onChange={e=>{
					this.setState({newEntryText: e.target.value});
				}}/>
				<button onClick={()=>{
					const entry = new TodoEntry({text: newEntryText});
					addTodoEntry({variables: {entry}});
					setNewEntryText("");
				}}>Add</button>
			</Row>
			{entries.map((entry, index)=>{
				return (
					<Row>
						<span>{entry.text}</span>
						<button disabled={index == 0} onClick={()=>{
							// todo
						}}>Up</button>
						<button disabled={index == entries.length - 1} onClick={()=>{
							// todo
						}}>Dn</button>
						<button onClick={()=>{
							// todo
						}}>X</button>
					</Row>
				);
			})}
		</Column>
	);
}