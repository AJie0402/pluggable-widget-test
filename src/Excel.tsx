import { ExcelContainerProps } from "../typings/ExcelProps";
import classNames from "classnames";
import "./ui/index.scss";
import React, { useState } from "react";
// import { Key } from "react";
// import { ObjectItem } from "mendix";
// @ts-ignore
const XLSX = require("xlsx");
// import { GoogleSpreadsheet } from "google-spreadsheet";

export default function (props: ExcelContainerProps) {
    const { datasource, columns } = props;
    const items = datasource.items ?? [];
    // columns.universe 取得所有欄位屬性名稱（string[]）
    const columnsArray = columns.universe ?? [];

    const [importedData, setImportedData] = useState<any[]>([]);
    const [editingCell, setEditingCell] = useState<{ rowIdx: number; colKey: string } | null>(null);
    const [colWidths, setColWidths] = useState<{ [key: string]: number }>({});
    const [resizing, setResizing] = useState<{ colKey: string; startX: number; startWidth: number } | null>(null);
    const [headerRow, setHeaderRow] = useState<string[]>([]);

    // 匯出 Excel
    const exportExcel = () => {
        let data: any[];
        if (importedData.length > 0) {
            // 用 allColumns 產生每一列，確保欄位順序正確
            data = importedData.map(row =>
                allColumns.reduce((obj, col) => {
                    obj[col] = row[col] ?? "";
                    return obj;
                }, {} as Record<string, any>)
            );
        } else {
            data = items.map(item =>
                allColumns.reduce((row: Record<string, any>, attrName: string) => {
                    row[attrName] = columns.get(item).value;
                    return row;
                }, {} as Record<string, any>)
            );
        }
        const ws = XLSX.utils.json_to_sheet(data, { header: allColumns });
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
        XLSX.writeFile(wb, "export.xlsx");
    };

    // 匯入 Excel
    const importExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = evt => {
            const data = evt.target?.result;
            if (!data) return;
            const workbook = XLSX.read(data, { type: "binary" });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            // 1. 取得二維陣列
            const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            // 1. 取得 headerRow
            const headerRow = json[0] as string[];
            const dataRows = json.slice(1);

            // 2. 取得所有資料列的最大長度
            const maxColCount = Math.max(
                headerRow.length,
                ...dataRows.map((row: any[]) => row.length)
            );

            // 3. 產生完整 allColumns
            const allColumns: string[] = [];
            for (let i = 0; i < maxColCount; i++) {
                allColumns.push(headerRow[i] ?? `Column${i + 1}`);
            }

            // 4. 產生 importedData
            const importedData = dataRows.map((rowArr: any[]) => {
                const rowObj: Record<string, any> = {};
                allColumns.forEach((col, idx) => {
                    rowObj[col] = rowArr[idx] ?? "";
                });
                return rowObj;
            });
            setImportedData(importedData);
            setHeaderRow(allColumns); // 這裡 headerRow 也用 allColumns
        };
        reader.readAsBinaryString(file);
    };

    // Google Sheets 匯出（預留，尚未實作）
    const exportToGoogleSheet = async () => {
        // TODO: 這裡串接 Google Sheets API
        console.log("預留：匯出到 Google Sheets");
    };

    // Google Sheets 匯入（預留，尚未實作）
    const importFromGoogleSheet = async () => {
        // TODO: 這裡串接 Google Sheets API
        console.log("預留：從 Google Sheets 匯入");
    };

    // 產生 Excel 樣式的欄位字母
    function getColumnLetter(idx: number) {
        let str = '';
        while (idx >= 0) {
            str = String.fromCharCode((idx % 26) + 65) + str;
            idx = Math.floor(idx / 26) - 1;
        }
        return str;
    }

    const handleCellClick = (rowIdx: number, colKey: string) => {
        setEditingCell({ rowIdx, colKey });
    };

    const handleCellChange = (e: React.ChangeEvent<HTMLInputElement>, rowIdx: number, colKey: string) => {
        const newValue = e.target.value;
        setImportedData(prev => {
            const newData = [...prev];
            newData[rowIdx] = { ...newData[rowIdx], [colKey]: newValue };
            return newData;
        });
    };

    const handleCellBlur = () => {
        setEditingCell(null);
    };

    // 拖曳開始
    const startResize = (e: React.MouseEvent, colKey: string) => {
        e.preventDefault();
        setResizing({
            colKey,
            startX: e.clientX,
            startWidth: colWidths[colKey] || 120,
        });
    };

    // 拖曳進行中
    React.useEffect(() => {
        if (!resizing) return;
        const onMouseMove = (e: MouseEvent) => {
            const delta = e.clientX - resizing.startX;
            const newWidth = Math.max(40, resizing.startWidth + delta);
            setColWidths(prev => ({ ...prev, [resizing.colKey]: newWidth }));
        };
        const onMouseUp = () => {
            setResizing(null);
        };
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };
    }, [resizing]);

    // 收集 importedData 所有列的所有欄位
    const allColumns = headerRow.length > 0 ? headerRow : Array.from(new Set([...columnsArray]));
    

    // 假設 originalData 是原本的資料
    // const mergeData = (originalData: any[], importedData: any[]): any[] => {
    //     return importedData.map((row: any, idx: number) => {
    //         const originalRow = originalData[idx] || {};
    //         const mergedRow = { ...originalRow };
    //         for (const key of Object.keys(row)) {
    //             if (row[key] !== "" && row[key] !== undefined && row[key] !== null) {
    //                 mergedRow[key] = row[key];
    //             }
    //             // 否則保留原本的值
    //         }
    //         return mergedRow;
    //     });
    // };

    const DEFAULT_ROWS = 20;
    const rowCount = importedData.length > 0 ? importedData.length : DEFAULT_ROWS;
    // 不需要 colCount
    // const colCount = allColumns.length > 0 ? allColumns.length : DEFAULT_COLS;
    const DEFAULT_COL_WIDTH = 160;
    const ROW_INDEX_WIDTH = 60;

    return (
        <div className={classNames("mendixcn-excel", props.class)} style={props.style}>
            <button onClick={exportExcel}>匯出 Excel</button>
            <input type="file" accept=".xlsx, .xls" onChange={importExcel} />
            <button onClick={exportToGoogleSheet}>匯出 Google Sheets（預留）</button>
            <button onClick={importFromGoogleSheet}>匯入 Google Sheets（預留）</button>
            {/* 預覽匯入資料 */}
            {importedData.length > 0 && (
                <div>
                    <h3>匯入資料預覽</h3>
                    <div style={{ width: "100%", maxWidth: "100vw", height: 400, overflow: "auto", border: "1px solid #ccc" }}>
                        <table style={{ minWidth: allColumns.length * DEFAULT_COL_WIDTH + ROW_INDEX_WIDTH }}>
                            <thead>
                                <tr>
                                    <th style={{ width: ROW_INDEX_WIDTH, minWidth: 40, maxWidth: 80 }}>#</th>
                                    {allColumns.map((colKey, idx) => (
                                        <th
                                            key={colKey}
                                            style={{
                                                width: colWidths[colKey] ? `${colWidths[colKey]}px` : `${DEFAULT_COL_WIDTH}px`,
                                                minWidth: 40,
                                                position: 'relative',
                                                userSelect: resizing && resizing.colKey === colKey ? 'none' : undefined,
                                            }}
                                        >
                                            {getColumnLetter(idx)}
                                            <span
                                                style={{
                                                    position: 'absolute',
                                                    right: 0,
                                                    top: 0,
                                                    height: '100%',
                                                    width: 8,
                                                    cursor: 'col-resize',
                                                    zIndex: 2,
                                                    display: 'inline-block',
                                                }}
                                                onMouseDown={e => startResize(e, colKey)}
                                            />
                                        </th>
                                    ))}
                                </tr>
                                <tr>
                                    <th style={{ width: ROW_INDEX_WIDTH, minWidth: 40, maxWidth: 80 }}></th>
                                    {allColumns.map(colKey => (
                                        <th key={colKey} style={{ width: colWidths[colKey] ? `${colWidths[colKey]}px` : `${DEFAULT_COL_WIDTH}px`, minWidth: 40 }}>{colKey}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {Array.from({ length: rowCount }).map((_, rowIdx) => (
                                    <tr key={rowIdx}>
                                        <td>{rowIdx + 1}</td>
                                        {allColumns.map((colKey, colIdx) => {
                                            const value = importedData[rowIdx]?.[colKey] ?? "";
                                            return (
                                                <td key={colIdx} onClick={() => handleCellClick(rowIdx, colKey)}>
                                                    {editingCell && editingCell.rowIdx === rowIdx && editingCell.colKey === colKey ? (
                                                        <input
                                                            value={value}
                                                            onChange={e => handleCellChange(e, rowIdx, colKey)}
                                                            onBlur={handleCellBlur}
                                                            autoFocus
                                                        />
                                                    ) : (
                                                        value
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            <table>
                <thead>
                    <tr>
                        {columnsArray.map((attrName: string) => (
                            <th key={attrName}>{attrName}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {items.map(item => (
                        <tr key={item.id}>
                            {columnsArray.map(attrName => (
                                <td key={attrName}>{columns.get(item).value}</td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
