import {Observer} from "../Utils/UI/MobX";
import React from "react";
import {Row} from "../Utils/ReactComponents/Row";
import {Column} from "../Utils/ReactComponents/Column";
import {TodoList} from "./Todo/TodoList";
import {ApolloProvider} from "@apollo/client";
import {InitPGLink, pgClient} from "../Utils/LibIntegrations/PGLink";

@Observer
export class RootUI extends React.Component<{}, {}> {
	UNSAFE_componentWillMount() {
		InitPGLink(); // only 1 variant atm, so init right away
	}
	render() {
		//const {page} = store.main;
		const page = "home";
		return (
			<ApolloProvider client={pgClient}>
				<Row className="background"/*"unselectable"*/ style={{height: "100%"}}>
					{/*<InfoButton_TooltipWrapper/>*/}
					<main style={{position: "relative", flex: 1, overflow: "hidden", display: "flex", justifyContent: "center", alignItems: "flex-start"}}>
						{page == "home" && <HomeUI/>}
					</main>
				</Row>
			</ApolloProvider>
		);
	}
}

/*class OverlayUI extends BaseComponent<{}, {}> {
	render() {
		return (
			<div style={{position: "absolute", top: 0, bottom: 0, left: 0, right: 0, overflow: "hidden"}}>
				<MessageBoxLayer/>
				<VMenuLayer/>
			</div>
		);
	}
}*/

class HomeUI extends React.Component<{}, {}> {
	render() {
		return (
			<Column>
				<TodoList/>
			</Column>
		);
	}
}