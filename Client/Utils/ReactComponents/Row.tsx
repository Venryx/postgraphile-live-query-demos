import React from "react";

export type RowProps = {noShrink?, center?, style?} & React.HTMLAttributes<HTMLDivElement>;
export class Row extends React.Component<RowProps, {}> {
	render() {
		let {noShrink, center, style, ...rest} = this.props;
		return <div {...rest} style={Object.assign({display: "flex"}, noShrink && {flexShrink: 0}, center && {alignItems: "center"}, style)}/>
	}
}