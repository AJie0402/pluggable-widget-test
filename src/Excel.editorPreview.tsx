import { parseStyle } from "./piw-utils-internal";
import { ExcelPreviewProps } from "../typings/ExcelProps";

declare function require(name: string): string;

export function preview(props: ExcelPreviewProps) {
    return <div style={parseStyle(props.style)}></div>;
}

export function getPreviewCss(): string {
    return require("./ui/index.scss");
}
