import { xtosExceljs } from "../xlsxspread.min";
//import * as React  from "react";
//import * as ReactDOM from "react-dom";
// 定義 props 型別
import type { BookTypeEnumEnum, TypeEnumEnum } from "../../typings/XSpreadsheetProps";

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
    isShowSave,
    isShowDownload,
    afterSaveAction
}: CustomExportToolbarProps) {
    // 下載 Excel
    const handleDownload = () => {
        if (spreadsheet) {
            const new_wb = xtosExceljs(spreadsheet.getData());
            new_wb.xlsx.writeBuffer().then(buffer => {
                const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = file.value.name;
                a.click();
                window.URL.revokeObjectURL(url);
            });
        }
    };

    // 儲存 Excel 並觸發 afterSaveAction
    const handleSave = () => {
        if (spreadsheet) {
            const new_wb = xtosExceljs(spreadsheet.getData());
            new_wb.xlsx.writeBuffer().then(buffer => {
                const fileBlob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
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
            });
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
