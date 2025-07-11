//import * as React from "react";
import { parseStyle } from "./piw-utils-internal";
import {XSpreadsheetPreviewProps } from "../typings/XSpreadsheetProps";

declare function require(name: string): string;

export function preview(props: XSpreadsheetPreviewProps) {
    return <div className={props.className} style={parseStyle(props.style)}></div>;
}

export function getPreviewCss(): string {
    return require("./ui/index.scss");
}
