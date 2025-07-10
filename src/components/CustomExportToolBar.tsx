import * as XLSX from "xlsx-js-style";
import { xtos } from "../xlsxspread.min";
//import * as React  from "react";
//import * as ReactDOM from "react-dom";
// 定義 props 型別
import type { BookTypeEnumEnum, TypeEnumEnum } from "../../typings/ExcelProps";

interface CustomExportToolbarProps {
    spreadsheet: { getData: () => any } | null;
    file: { value: { name: string; uri: string } };
    bookSST: boolean;
    compression: boolean;
    bookType: BookTypeEnumEnum;
    type: TypeEnumEnum;
    cellStyles: boolean;
    isShowSave: boolean;
    isShowDownload: boolean;
    afterSaveAction?: {
        isExecuting: boolean;
        canExecute: boolean;
        execute: () => void;
    };
}

/**
 * 匯出與儲存工具列元件
 */
export function CustomExportToolbar({
    spreadsheet,
    file,
    bookSST,
    compression,
    bookType,
    type,
    cellStyles,
    isShowSave,
    isShowDownload,
    afterSaveAction
}: CustomExportToolbarProps) {
    // 下載 Excel
    const handleDownload = () => {
        if (spreadsheet) {
            const new_wb = xtos(spreadsheet.getData());
            XLSX.writeFile(new_wb, file.value.name);
        }
    };

    // 將 bookTypeEnumEnum 轉為 SheetJS 支援的 BookType
    function getSheetJSBookType(bookType: BookTypeEnumEnum): XLSX.BookType {
        // SheetJS 不支援 'numbers'，預設 fallback 為 'xlsx'
        if (bookType === 'numbers') return 'xlsx';
        return bookType as XLSX.BookType;
    }

    // 儲存 Excel 並觸發 afterSaveAction
    const handleSave = () => {
        if (spreadsheet) {
            const new_wb = xtos(spreadsheet.getData());
            // 產生檔案資料
            const fileData = XLSX.write(new_wb, {
                bookSST: bookSST,
                compression: compression,
                bookType: getSheetJSBookType(bookType),
                type: type,
                cellStyles: cellStyles
            });
            // 轉為 Blob
            const fileBlob = new Blob([fileData], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
            // 取得 guid
            const urlObj = new URL(file.value.uri);
            const params = new URLSearchParams(urlObj.search);
            const guid = params.get('guid');
            if (!guid) return;
            // 儲存文件
            mx.data.saveDocument(
                guid,
                file.value.name,
                {},
                fileBlob,
                function () {
                    if (afterSaveAction && !afterSaveAction.isExecuting) {
                        if (afterSaveAction.canExecute) {
                            afterSaveAction.execute();
                        } else {
                            console.log('After save action is executing.');
                        }
                    }
                },
                function (e) {
                    console.error(e);
                }
            );
        }
    };

    const btnClassNames = "btn mx-button btn-default spacing-outer-bottom-medium";

    return (
        <div>
            {isShowSave && (
                <button className={btnClassNames} onClick={handleSave}>
                    Save
                </button>
            )}
            {isShowDownload && (
                <button className={btnClassNames} onClick={handleDownload}>
                    Download
                </button>
            )}
        </div>
    );
}
