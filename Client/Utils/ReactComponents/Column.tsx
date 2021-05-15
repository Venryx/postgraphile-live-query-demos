import React from "react";

export type ColumnProps = {noShrink?, center?, style?} & React.HTMLAttributes<HTMLDivElement>;
export class Column extends React.Component<ColumnProps, {}> {
	render() {
		let {noShrink, center, style, ...rest} = this.props;
		return <div {...rest} style={Object.assign({display: "flex", flexDirection: "column"}, noShrink && {flexShrink: 0}, center && {alignItems: "center"}, style)}/>
	}
}