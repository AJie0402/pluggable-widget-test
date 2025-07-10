import { useRef, useEffect, useState } from "react";
import { XSpreadsheetContainerProps } from "../typings/XSpreadsheetProps";
import Spreadsheet from "x-data-spreadsheet";
import * as XLSX from "xlsx-js-style";
import { stox } from "./xlsxspread.min";
import { CustomExportToolbar } from "./components/CustomExportToolBar";
// 定義 props 的型別介面
    export function MendixSpreadsheet({
        fileDocument,
        editable,
        bookSST,
        compression,
        bookTypeEnum,
        typeEnum,
        cellStyles,
        isShowSave,
        isShowDownload,
        afterSaveAction,
        widthOffset
    }: XSpreadsheetContainerProps) { 
    // Spreadsheet 容器的 DOM 參考
    const el = useRef<HTMLDivElement>(null);
    // 當前可用的檔案物件狀態
    const [availablefile, setFile] = useState<any>(fileDocument);
    // Spreadsheet 實例狀態
    const [spreadsheet, setSpreadsheet] = useState<Spreadsheet | null>(null);

    // 當檔案變動時，載入 Excel 並初始化 Spreadsheet
    useEffect(() => {
        // 如果已經有 spreadsheet 實例，不重複載入
        if (spreadsheet) return;
        
        // 檢查檔案是否可用且有 URI
        if (availablefile && availablefile.status === "available" && availablefile.value?.uri) {
            const fetchData = async () => {
                try {
                    // 下載檔案內容
                    const response = await fetch(availablefile.value.uri);
                    const arrayBuffer = await response.arrayBuffer();
                    
                    // 使用 XLSX 解析 Excel 檔案
                    const workbook = XLSX.read(arrayBuffer, { type: "array" });

                    // 檢查 DOM 元素是否準備好
                    if (!el.current) {
                        console.warn("Spreadsheet container not ready");
                        return;
                    }

                    // 初始化 Spreadsheet 實例
                    const s = new Spreadsheet(el.current, {
                        view: {
                            // 設定高度為視窗高度
                            height: () => document.documentElement.clientHeight,
                            // 設定寬度為視窗寬度減去偏移量
                            width: () => document.documentElement.clientWidth - widthOffset
                        },
                        // 如果是唯讀模式，關閉相關功能
                        ...(!editable && {
                            mode: "read",
                            showToolbar: false,
                            showGrid: false,
                            showContextmenu: false
                        })
                    });

                    // 將 workbook 轉換為 x-data-spreadsheet 格式並載入
                    const data = stox(workbook);
                    s.loadData(data);

                    // 儲存 spreadsheet 實例到狀態
                    setSpreadsheet(s);
                } catch (err) {
                    console.error("載入 Excel 檔案失敗", err);
                }
            };
            fetchData();
        }
    }, [availablefile, spreadsheet, editable, widthOffset]);

    // 當 fileDocument 變動時，更新 availablefile 狀態
    useEffect(() => {
        setFile(fileDocument);
    }, [fileDocument]);

    return (
        <div>
            {/* 工具列，提供匯出/儲存等功能 */}
            <CustomExportToolbar 
                spreadsheet={spreadsheet}
                file={availablefile}
                bookSST={bookSST}
                compression={compression}
                bookType={bookTypeEnum} 
                type={typeEnum} 
                cellStyles={cellStyles}
                isShowSave={isShowSave && editable}
                isShowDownload={isShowDownload}
                afterSaveAction={afterSaveAction}
            />
            {/* Spreadsheet 顯示區域 */}
            <div id="gridctr" ref={el} />
        </div>
    );
}
