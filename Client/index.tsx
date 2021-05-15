import {RootUI} from "./UI/Root";
import React from "react";
import ReactDOM from "react-dom";
import {Buffer} from "buffer";

window["Buffer"] = Buffer; // probably temp; for slugid

const mountNode = document.getElementById("root");
ReactDOM.render(<RootUI/>, mountNode);