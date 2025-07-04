import { StructurePreviewProps } from "./piw-utils-internal";
import { ExcelPreviewProps } from "../typings/ExcelProps";
import { Properties, transformGroupsIntoTabs } from "@mendix/pluggable-widgets-tools";

export function getProperties(
    values: ExcelPreviewProps,
    defaultProperties: Properties,
    platform: "web" | "desktop"
): Properties {
    console.log(values);
    if (platform === "web") {
        transformGroupsIntoTabs(defaultProperties);
    }
    return defaultProperties;
}
export function getPreview(values: ExcelPreviewProps): StructurePreviewProps | null {
    console.log(values);
    return null;
}
