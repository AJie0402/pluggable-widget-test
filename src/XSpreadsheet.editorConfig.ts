import { StructurePreviewProps } from "./piw-utils-internal";
import type { Properties } from "@mendix/pluggable-widgets-tools";
// 直接於此宣告 ExcelPreviewProps 型別
export interface ExcelPreviewProps {
    className: string;
    style: string;
    styleObject?: object;
    readOnly: boolean;
    fileDocument: string;
    editable: boolean;
    isShowSave: boolean;
    isShowDownload: boolean;
    widthOffset: number | null;
    afterSaveAction: {} | null;
    bookSST: boolean;
    compression: boolean;
    bookTypeEnum: string;
    typeEnum: string;
    cellStyles: boolean;
}

/**
 * 控制 Studio/Studio Pro 屬性面板顯示
 */
export function getProperties(
    _values: ExcelPreviewProps,
    defaultProperties: Properties,
    platform: "web" | "desktop"
): Properties {
    // 可根據 platform 或 values 決定屬性顯示
    if (platform === "web") {
        // @ts-ignore
        if (typeof transformGroupsIntoTabs === 'function') {
            // @ts-ignore
            transformGroupsIntoTabs(defaultProperties);
        }
    }
    return defaultProperties;
}

/**
 * 控制 Studio Pro preview 區塊顯示
 */
export function getPreview(_values: ExcelPreviewProps): StructurePreviewProps | null {
    return null;
}
