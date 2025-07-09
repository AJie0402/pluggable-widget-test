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

    // 匯出 Excel
    const exportExcel = () => {
        let data: any[];
        if (importedData.length > 0) {
            data = importedData;
        } else {
            data = items.map(item =>
                columnsArray.reduce((row: Record<string, any>, attrName: string) => {
                    row[attrName] = columns.get(item).value;
                    return row;
                }, {} as Record<string, any>)
            );
        }
        const ws = XLSX.utils.json_to_sheet(data);
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
            const json = XLSX.utils.sheet_to_json(worksheet);
            setImportedData(json as any[]); // 這裡存到 state
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
                    <table>
                        <thead>
                            <tr>
                                <th style={{background:'#f0f0f0',color:'#888'}}>#</th>
                                {Object.keys(importedData[0]).map((key, idx) => (
                                    <th key={key}>{getColumnLetter(idx)}</th>
                                ))}
                            </tr>
                            <tr>
                                <th style={{background:'#f0f0f0',color:'#888'}}></th>
                                {Object.keys(importedData[0]).map(key => (
                                    <th key={key}>{key}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {importedData.map((row, idx) => (
                                <tr key={idx}>
                                    <td style={{background:'#f0f0f0',color:'#888',fontWeight:600}}>{idx+1}</td>
                                    {Object.values(row).map((val, i) => (
                                        <td key={i}>{val as any}</td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
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
