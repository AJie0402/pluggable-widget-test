import ExcelJs from "exceljs";
/**
 * 將 exceljs.Workbook 轉換為 x-spreadsheet 的資料格式，並保留樣式
 */
export function stoxExceljs(wb: ExcelJs.Workbook) {
    const out: any[] = [];
    wb.worksheets.forEach(ws => {
        const o: any = { name: ws.name, rows: {}, merges: [], styles: [] };
        const styleMap = new Map<string, number>();

        // 先找出最大欄位數
        let maxCol = 0;
        ws.eachRow(row => {
            if (row.cellCount > maxCol) maxCol = row.cellCount;
        });

        ws.eachRow((row, rowNumber) => {
            const cells: any = {};
            for (let col = 1; col <= maxCol; col++) {
                const cell = row.getCell(col);
                const cellText = cell.value ? String(cell.value) : "";

                // 轉換 cell 樣式
                const style: any = {};
                if (cell.font?.bold) style.bold = true;
                if (cell.font?.italic) style.italic = true;
                if (cell.font?.size) style.fontSize = cell.font.size;
                if (cell.font?.name) style.fontName = cell.font.name;
                if (cell.font?.color?.argb) style.color = "#" + cell.font.color.argb.slice(-6);
                if (cell.fill && cell.fill.type === "pattern" && cell.fill.fgColor?.argb) {
                    style.bgcolor = "#" + cell.fill.fgColor.argb.slice(-6);
                }
                if (cell.alignment?.horizontal) style.align = cell.alignment.horizontal;
                if (cell.alignment?.vertical) style.valign = cell.alignment.vertical;
                if (cell.alignment?.wrapText) style.textwrap = true;
                if (cell.border) {
                    style.border = {};
                    (["top", "bottom", "left", "right"] as const).forEach(side => {
                        const b = cell.border?.[side];
                        if (b) style.border[side] = [b.style || "thin", b.color?.argb ? "#" + b.color.argb.slice(-6) : "#000"];
                    });
                }

                // 建立 style 索引
                let styleIndex = -1;
                const styleKey = JSON.stringify(style);
                if (styleKey !== "{}") {
                    if (!styleMap.has(styleKey)) {
                        styleIndex = o.styles.length;
                        styleMap.set(styleKey, styleIndex);
                        o.styles.push(style);
                    } else {
                        styleIndex = styleMap.get(styleKey)!;
                    }
                }

                cells[col - 1] = { text: cellText };
                if (styleIndex >= 0) cells[col - 1].style = styleIndex;
            }
            o.rows[rowNumber - 1] = { cells };
        });
        o.rows.len = ws.rowCount;

        // 合併儲存格處理
        const merges: Map<string, any> = (ws as any).merges;
        if (merges) {
            merges.forEach((_, key) => {
                o.merges.push(key);
                // 合併屬性到 cell
                const [start, end] = key.split(":");
                const startCol = start.replace(/[^A-Z]/g, "");
                const startRow = parseInt(start.replace(/[^0-9]/g, ""), 10) - 1;
                const endCol = end.replace(/[^A-Z]/g, "");
                const endRow = parseInt(end.replace(/[^0-9]/g, ""), 10) - 1;

                // 將 A~Z 轉成 0-based index
                const colToIndex = (col: string) =>
                    col.split("").reduce((r, c) => r * 26 + c.charCodeAt(0) - 65, 0);

                const sCol = colToIndex(startCol);
                const eCol = colToIndex(endCol);

                if (!o.rows[startRow]) o.rows[startRow] = { cells: {} };
                if (!o.rows[startRow].cells[sCol]) o.rows[startRow].cells[sCol] = {};
                o.rows[startRow].cells[sCol].merge = [endRow - startRow, eCol - sCol];
            });
        }

        out.push(o);
    });
    return out;
}
/**
 * x-spreadsheet 資料格式轉回 XLSX.WorkBook
 *
 * 注意：目前未支援 x-spreadsheet 轉回 exceljs 或 xlsx-js-style，
 * 如需此功能請自行實作。
 */
// export function xtos(sdata: XSheet[], keepMerges = true, keepFormulas = true): XLSX.WorkBook {
//     // 轉換 x-spreadsheet style 為 xlsx-js-style style
//     function transformStyle(styleObj: { [key: string]: any }): { [key: string]: any } {
//         const result: { [key: string]: any } = {};
//         if (styleObj)
//             Object.keys(styleObj).map(key => {
//                 switch (key) {
//                     case "align":
//                         result["alignment"] = Object.assign(result["alignment"] || {}, { horizontal: styleObj[key] });
//                         break;
//                     case "valign":
//                         result["alignment"] = Object.assign(result["alignment"] || {}, { vertical: styleObj[key] });
//                         break;
//                     case "font":
//                         result["font"] = Object.assign(result["font"] || {}, styleObj[key]);
//                         if (result["font"] && result["font"]["size"])
//                             result["font"] = Object.assign(result["font"] || {}, { sz: styleObj[key]["size"] });
//                         break;
//                     case "underline":
//                         result["font"] = Object.assign(result["font"] || {}, { underline: styleObj[key] });
//                         break;
//                     case "strike":
//                         result["font"] = Object.assign(result["font"] || {}, { strike: styleObj[key] });
//                         break;
//                     case "color":
//                         result["font"] = Object.assign(result["font"] || {}, {
//                             color: { rgb: styleObj[key].slice(1) }
//                         });
//                         break;
//                     case "bgcolor":
//                         result["fill"] = Object.assign(result["fill"] || {}, {
//                             fgColor: { rgb: styleObj[key].slice(1) },
//                             patternType: "solid"
//                         });
//                         break;
//                     case "border":
//                         result["border"] = Object.assign(result["border"] || {}, {
//                             top: styleObj[key]["top"]
//                                 ? { style: styleObj[key]["top"][0], color: { rgb: styleObj[key]["top"][1].slice(1) } }
//                                 : null,
//                             bottom: styleObj[key]["bottom"]
//                                 ? {
//                                       style: styleObj[key]["bottom"][0],
//                                       color: { rgb: styleObj[key]["bottom"][1].slice(1) }
//                                   }
//                                 : null,
//                             left: styleObj[key]["left"]
//                                 ? { style: styleObj[key]["left"][0], color: { rgb: styleObj[key]["left"][1].slice(1) } }
//                                 : null,
//                             right: styleObj[key]["right"]
//                                 ? {
//                                       style: styleObj[key]["right"][0],
//                                       color: { rgb: styleObj[key]["right"][1].slice(1) }
//                                   }
//                                 : null
//                         });
//                         break;
//                     case "textwrap":
//                         result["alignment"] = Object.assign(result["alignment"] || {}, { wrapText: styleObj[key] });
//                         break;
//                     default:
//                 }
//             });
//         return result;
//     }
//     // 轉換格式字串
//     function formatText(styleObj: { [key: string]: any }): string {
//         let format = "";
//         if (styleObj)
//             Object.keys(styleObj).map(key => {
//                 if ("format" === key) {
//                     switch (styleObj[key]) {
//                         case "scientific":
//                             format = "0.00E+0";
//                             break;
//                         case "percent":
//                             format = "0.00%";
//                             break;
//                         case "number":
//                             format = "0.00";
//                             break;
//                         default:
//                     }
//                 }
//             });
//         return format;
//     }
//     const out = XLSX.utils.book_new();
//     sdata.forEach(xws => {
//         const ws: XLSX.WorkSheet = {};
//         const rowobj = xws.rows;
//         let minCoord = { r: 0, c: 0 }, maxCoord = { r: 0, c: 0 };
//         for (let ri = 0; ri < rowobj.len!; ++ri) {
//             const row = rowobj[ri];
//             if (!row) continue;
//             Object.keys(row.cells).forEach(k => {
//                 const idx = +k;
//                 if (isNaN(idx)) return;
//                 const lastRef = XLSX.utils.encode_cell({ r: ri, c: idx });
//                 // 計算範圍
//                 if (minCoord === undefined) {
//                     minCoord = { r: ri, c: idx };
//                 } else {
//                     if (ri < minCoord.r) minCoord.r = ri;
//                     if (idx < minCoord.c) minCoord.c = idx;
//                 }
//                 if (maxCoord === undefined) {
//                     maxCoord = { r: ri, c: idx };
//                 } else {
//                     if (ri > maxCoord.r) maxCoord.r = ri;
//                     if (idx > maxCoord.c) maxCoord.c = idx;
//                 }
//                 // 內容與型別判斷
//                 let cellText = (row.cells as any)[k].text,
//                     type: "s" | "n" | "b" | "z" = "s";
//                 if (!cellText) {
//                     cellText = "";
//                     const styleIndex = (row.cells as any)[k].style;
//                     if (undefined === styleIndex || null === styleIndex) {
//                         type = "z";
//                     }
//                     if (
//                         undefined !== styleIndex &&
//                         xws.styles[styleIndex] &&
//                         xws.styles[styleIndex]["format"] &&
//                         "scientific" === xws.styles[styleIndex]["format"]
//                     ) {
//                         cellText = 0;
//                         type = "n";
//                     }
//                 } else if (!isNaN(parseFloat(cellText))) {
//                     cellText = parseFloat(cellText);
//                     type = "n";
//                 } else if (cellText === "true" || cellText === "false") {
//                     cellText = Boolean(cellText);
//                     type = "b";
//                 }
//                 (ws as any)[lastRef] = {
//                     v: cellText,
//                     t: type,
//                     z: formatText(xws.styles[(row.cells as any)[k].style]),
//                     s: transformStyle(xws.styles[(row.cells as any)[k].style])
//                 };
//                 // 公式處理
//                 if (keepFormulas && type === "s" && typeof cellText === "string" && cellText[0] === "=") {
//                     (ws as any)[lastRef].f = cellText.slice(1);
//                 }
//                 // 合併儲存格
//                 if (keepMerges && (row.cells as any)[k].merge !== undefined) {
//                     if ((ws as any)["!merges"] === undefined) (ws as any)["!merges"] = [];
//                     (ws as any)["!merges"].push({
//                         s: { r: ri, c: idx },
//                         e: {
//                             r: ri + (row.cells as any)[k].merge![0],
//                             c: idx + (row.cells as any)[k].merge![1]
//                         }
//                     });
//                 }
//             });
//             (ws as any)["!ref"] =
//                 XLSX.utils.encode_cell({ r: minCoord.r, c: minCoord.c }) +
//                 ":" +
//                 XLSX.utils.encode_cell({ r: maxCoord.r, c: maxCoord.c });
//         }
//         XLSX.utils.book_append_sheet(out, ws, xws.name);
//     });
//     return out;
// }

/**
 * 將 x-spreadsheet 物件匯出為 XLSX.WorkBook 並於 console.log 顯示
 */
export function exportSheet(sheet: { getData: () => XSheet[] }, _filename: string) {
    const new_wb = xtosExceljs(sheet.getData());
    console.log(new_wb);
}

type XSheet = {
    name: string;
    rows: {
        [key: number]: {
            cells: {
                [key: number]: {
                    text?: string;
                    styles?: number;
                    merge?: [number, number];
                };
            };
        };
        len?: number;
    };
    styles:{[key: number]: {[key: string]: any} };
    merges: string[];
};
type XSpreadsheetCell = {
    text?: string;
    style?: number;
};

type XSpreadsheetRow = {
    cells: { [colIdx: number]: XSpreadsheetCell };
};
/**
 * 將 x-spreadsheet 的資料轉為 exceljs.Workbook
 */
export function xtosExceljs(sheets: XSheet[]): ExcelJs.Workbook {
    const wb = new ExcelJs.Workbook();

    sheets.forEach(sheet => {
        const ws = wb.addWorksheet(sheet.name || "Sheet1");
        const sheetData = sheets[0];
        const styles = sheetData.styles || [];
        const getStyle = (styleId: number) => styles[styleId] || {};
        // 填入資料
        Object.entries(sheetData.rows || {}).forEach(([rowIdx, rowData]) => {
            if (rowIdx === "len") return; // 跳過 len 屬性
            const excelRow = ws.getRow(Number(rowIdx) + 1);
            if (typeof rowData === "object" && rowData !== null && "cells" in rowData) {
                Object.entries((rowData as XSpreadsheetRow).cells || {}).forEach(([colIdx, cellData]) => {
                    const cell = cellData as XSpreadsheetCell;
                    const excelCell = excelRow.getCell(Number(colIdx) + 1);
                    excelCell.value = cell.text ?? "";
                    const style = getStyle(cell.style as number);
                    if (style) {
                        const font: Partial<ExcelJs.Font> = {};
                        if (style.bold) font.bold = true;
                        if (style.italic) font.italic = true;
                        if (style.fontSize) font.size = style.fontSize;
                        if (style.fontName) font.name = style.fontName;
                        if (style.color) font.color = { argb: style.color.replace("#", "") };
                        if (Object.keys(font).length) excelCell.font = font;
    
                        if (style.bgcolor) {
                            excelCell.fill = {
                                type: "pattern",
                                pattern: "solid",
                                fgColor: { argb: style.bgcolor.replace("#", "") }
                            };
                        }
    
                        if (style.textwrap || style.align || style.valign) {
                            excelCell.alignment = {
                                wrapText: !!style.textwrap,
                                horizontal: style.align || undefined,
                                vertical: style.valign || undefined
                            };
                        }
    
                        if (style.border) {
                            const allowedBorderStyles = [
                                "thin", "dotted", "dashDot", "hair", "dashDotDot", "slantDashDot", "mediumDashed",
                                "mediumDashDotDot", "mediumDashDot", "medium", "double", "thick"
                            ] as const;
                            type BorderStyle = typeof allowedBorderStyles[number];
                            const convertBorder = (b: [string, string]) => ({
                                style: (allowedBorderStyles.includes(b[0] as BorderStyle) ? b[0] : "thin") as BorderStyle,
                                color: { argb: (b[1] || "#000000").replace("#", "") }
                            });
                            excelCell.border = {
                                top: style.border.top ? convertBorder(style.border.top) : undefined,
                                bottom: style.border.bottom ? convertBorder(style.border.bottom) : undefined,
                                left: style.border.left ? convertBorder(style.border.left) : undefined,
                                right: style.border.right ? convertBorder(style.border.right) : undefined
                            };
                        }
                    }
                });
            }
        });
        // for (let r = 0; r < (sheet.rows.len || 0); r++) {
        //     const row = sheet.rows[r];
        //     if (!row) continue;
        //     const excelRow = ws.getRow(r + 1);
        //     Object.entries(row.cells).forEach(([c, cell]) => {
        //         excelRow.getCell(Number(c) + 1).value = cell.text || "";
        //     });
        // }
        // 合併儲存格
        if (sheet.merges) {
            sheet.merges.forEach(range => {
                ws.mergeCells(range);
            });
        }
    });

    return wb;
}
