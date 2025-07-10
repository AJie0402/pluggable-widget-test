/**
 * This file was generated from XSpreadsheet.xml
 * WARNING: All changes made to this file will be overwritten
 * @author Mendix UI Content Team
 */
import { CSSProperties } from "react";
import { ActionValue, DynamicValue, FileValue } from "mendix";

export type BookTypeEnumEnum = "xlsx" | "xlsm" | "xlsb" | "biff8" | "numbers" | "csv" | "txt" | "html";

export type TypeEnumEnum = "array" | "base64" | "binary" | "string";

export interface XSpreadsheetContainerProps {
    name: string;
    class: string;
    style?: CSSProperties;
    tabIndex?: number;
    fileDocument?: DynamicValue<FileValue>;
    editable: boolean;
    isShowSave: boolean;
    isShowDownload: boolean;
    widthOffset: number;
    afterSaveAction?: ActionValue;
    bookSST: boolean;
    compression: boolean;
    bookTypeEnum: BookTypeEnumEnum;
    typeEnum: TypeEnumEnum;
    cellStyles: boolean;
}

export interface XSpreadsheetPreviewProps {
    className: string;
    style: string;
    styleObject?: CSSProperties;
    readOnly: boolean;
    fileDocument: string;
    editable: boolean;
    isShowSave: boolean;
    isShowDownload: boolean;
    widthOffset: number | null;
    afterSaveAction: {} | null;
    bookSST: boolean;
    compression: boolean;
    bookTypeEnum: BookTypeEnumEnum;
    typeEnum: TypeEnumEnum;
    cellStyles: boolean;
}
