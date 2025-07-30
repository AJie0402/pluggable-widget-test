import ExcelJs from "exceljs";
/**
 * 將 exceljs.Workbook 轉換為 x-spreadsheet 的資料格式，並保留樣式
 */
export type XSheet = {
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
    freeze?: string | [number, number]; // 凍結窗格設定
};
export type XSpreadsheetCell = {
    text?: string;
    style?: number;
};
export type XSpreadsheetRow = {
    cells: { [colIdx: number]: XSpreadsheetCell };
};

/**
@excel 讀取出來呈現在xpreadsheets電子表單畫面上
*/
export function stoxExceljs(wb: ExcelJs.Workbook) {
    const out: any[] = [];
  
    wb.worksheets.forEach(ws => {
        // 初始化單一 sheet 的資料結構
        const o: any = {
            name: ws.name, // 工作表名稱
            rows: {} as Record<number, { cells: Record<number, any> }>, // 所有列
            styles: [] as any[], // 樣式陣列
            merges: [] as string[], // 合併儲存格範圍
            cols: { len: 0, widths: [] as number[] }, // 欄寬資訊
            heights: [] as number[], // 列高資訊
            frozen:[] as any[] //凍結
        };

        // 取最大欄位數
        let maxCol = 0;
        ws.eachRow(row => {
            if (row.cellCount > maxCol) maxCol = row.cellCount;
        });

        // 取得每一欄的寬度
        for (let c = 1; c <= maxCol; c++) {
            const col = ws.getColumn(c);
            o.cols.widths.push(col.width); // 預設100，可依需求調整
        }
        o.cols.len = maxCol;

        // 取得每一列的高度
        ws.eachRow((row, rowNumber) => {
            o.heights[rowNumber - 1] = row.height || 24; // 預設24，可依需求調整
        });

        // 先建立所有 row (key 從0開始)
        for (let r = 0; r < ws.rowCount; r++) {
            o.rows[r] = { cells: {} };
        }

        // style cache Map，避免重複樣式
        const styleMap = new Map<string, number>();

        // 逐列逐欄處理每個 cell
        ws.eachRow((row, rowNumber) => {
            const cells: Record<number, any> = {};

            for (let col = 1; col <= maxCol; col++) {
                const rowcell = row.getCell(col);
                let cellText = "";

                // 判斷儲存格值
                if (rowcell.value == null) {
                    cellText = "";
                } else if (typeof rowcell.value === "object") {
                    if ("text" in rowcell.value && typeof (rowcell.value as any).text === "string") {
                        cellText = (rowcell.value as any).text;
                    } else if ("richText" in rowcell.value && Array.isArray((rowcell.value as any).richText)) {
                        cellText = (rowcell.value as any).richText.map((rt: any) => rt.text).join("");
                    } else if ("formula" in rowcell.value) {
                        cellText = "=" + (rowcell.value as any).formula;
                    } else if (rowcell.value instanceof Date) {
                        cellText = rowcell.value.toISOString().slice(0, 10);
                    } else {
                        try {
                            cellText = JSON.stringify(rowcell.value);
                        } catch {
                            cellText = "";
                        }
                    }
                } else {
                    cellText = String(rowcell.value);
                }
                // 轉換 cell 樣式
                const Excelimportstyle: any = {};
                // 字體
                if (rowcell.font) {
                    Excelimportstyle.font = {};
                    if (rowcell.font.name) Excelimportstyle.font.name = rowcell.font.name;
                    if (rowcell.font.size) Excelimportstyle.font.size = rowcell.font.size;
                    if (rowcell.font.bold === true) Excelimportstyle.font.bold = rowcell.font.bold;
                    if (rowcell.font.italic === true) Excelimportstyle.font.italic = rowcell.font.italic;
                    if (rowcell.font.underline === true || typeof rowcell.font.underline === "string") Excelimportstyle.underline = rowcell.font.underline;
                    if (rowcell.font.strike === true) Excelimportstyle.strike = rowcell.font.strike;
                    if (rowcell.font.color?.argb) {
                        Excelimportstyle.color = "#" + rowcell.font.color.argb.slice(-6);
                    }
                }
                // 背景色
                if (rowcell.fill && rowcell.fill.type === "pattern" && rowcell.fill.fgColor?.argb) {
                    Excelimportstyle.bgcolor = "#" + rowcell.fill.fgColor.argb.slice(-6);
                }
                // 對齊
                if (rowcell.alignment?.horizontal) Excelimportstyle.align = rowcell.alignment.horizontal;
                if (rowcell.alignment?.vertical) Excelimportstyle.valign = rowcell.alignment.vertical;
                if (rowcell.alignment?.wrapText) Excelimportstyle.textwrap = rowcell.alignment.wrapText;
                // 邊框
                if (!Excelimportstyle.border) Excelimportstyle.border = {};
                // 判斷這個 cell 是否有邊框設定
                if (rowcell.border) {
                    // 針對四個方向分別處理
                    (["top", "bottom", "left", "right"] as const).forEach(side => {
                        // 如果該方向有設定邊框
                        const BorderSide =  rowcell.border![side];
                        if (BorderSide) {
                            // 取得邊框樣式，沒有就預設 "thin"
                            const BorderStyle = BorderSide.style || "thin";
                            // 取得邊框顏色物件
                            const BorderColor = BorderSide.color;
                            // 預設顏色為黑色
                            let color = "#000000";
                            // 如果有設定顏色，且 argb 是長度8的字串，取最後6碼轉成 #RRGGBB
                            if (BorderColor?.argb && typeof BorderColor.argb === "string" && BorderColor.argb.length === 8) {
                                color = "#" + BorderColor.argb.slice(-6);
                            }
                            // 將該方向的邊框樣式與顏色存到 Excelimportstyle.border
                            // 這裡假設 Excelimportstyle.border 已經是物件
                            Excelimportstyle.border[side] = [BorderStyle, color];
                        }
                    });
                }

                // 建立 style 索引，避免重複樣式
                let styleIndex = -1;
                const styleKey = JSON.stringify(Excelimportstyle);
                if (styleKey !== "{}") {
                    if (styleMap.has(styleKey)) {
                        styleIndex = styleMap.get(styleKey)!;
                    } else {
                        styleIndex = o.styles.length;
                        styleMap.set(styleKey, styleIndex);
                        o.styles.push(Excelimportstyle);
                    }
                }

                // 設定 cell 內容及樣式索引
                cells[col - 1] = { text: cellText };
                if (styleIndex >= 0) {
                    cells[col - 1].style = styleIndex;
                }
            }

            o.rows[rowNumber - 1] = { cells };
        });

        // 合併儲存格處理
        if (ws.hasMerges) {
            // 將 Excel 欄位字母轉成 0-based 索引的輔助函式
            const colToIndex = (col: string) =>
                col.split("").reduce((r, c) => r * 26 + c.charCodeAt(0) - 65, 0);

            // 逐一處理每個合併範圍
            (ws.model.merges).forEach((range: string) => {
                o.merges.push(range);
                //取得欄位合併 起點 & 終點
                const [start, end] = range.split(":");

                const startCol = start.replace(/[^A-Z]/g, ""); // 起始欄位字母
                const startRow = parseInt(start.replace(/[^0-9]/g, ""), 10) - 1; // 起始列（0-based）
                const endCol = end.replace(/[^A-Z]/g, "");   // 結束欄位字母
                const endRow = parseInt(end.replace(/[^0-9]/g, ""), 10) - 1;   // 結束列（0-based）

                const sCol = colToIndex(startCol); // 起始欄位 index
                const eCol = colToIndex(endCol);   // 結束欄位 index

                //設定左上角 cell 的 merge 屬性
                // if (!o.rows[startRow]) o.rows[startRow] = { cells: {} };
                // if (!o.rows[startRow].cells) o.rows[startRow].cells = {};
                // if (!o.rows[startRow].cells[sCol]) o.rows[startRow].cells[sCol] = {};

                o.rows[startRow].cells[sCol].merge = [endRow - startRow, eCol - sCol];

                //將被合併覆蓋的 cell 移除（只保留左上角 cell）
                for (let r = startRow; r <= endRow; r++) {
                    for (let c = sCol; c <= eCol; c++) {
                        if (r === startRow && c === sCol) continue;
                        if (o.rows[r]?.cells && c in o.rows[r].cells) {
                            delete o.rows[r].cells[c];
                        }
                    }
                }
            });
        }
        // 凍結
        // 取得 Excel 凍結資訊，轉換為 x-spreadsheet 格式
        ws.views.forEach(
            (view: ExcelJs.WorksheetView) => {
                if (view.state == "frozen") {
                    // 優先使用 topLeftCell，如果沒有則根據 xSplit/ySplit 計算
                    if (view.topLeftCell) {
                        o.freeze = view.topLeftCell;
                    } else if (view.xSplit !== undefined || view.ySplit !== undefined) {
                        // 根據 xSplit/ySplit 計算凍結位置
                        const xSplit = view.xSplit || 0;
                        const ySplit = view.ySplit || 0;
                        o.freeze = [ySplit, xSplit]; // [row, col] 格式
                    }
                }
            }
        );
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
 * 將 x-spreadsheet 物件匯出為 XLSX.WorkBook
 */
export function exportSheet(sheet: { getData: () => XSheet[] }, _filename: string) {
    const new_wb = xtosExceljs(sheet.getData());
    console.log(new_wb);
}
/**
 * 將 x-spreadsheet 的資料轉為 exceljs.Workbook
 */
export function xtosExceljs(sheets: XSheet[]): ExcelJs.Workbook {
    const wb = new ExcelJs.Workbook();

    sheets.forEach(sheet => {
        // 新增一個 worksheet
        const ws = wb.addWorksheet(sheet.name || "Sheet1");
        const sheetData = sheet;  // 使用當前迭代的 sheet，而不是第一個
        const styles = sheetData.styles || [];
        // 取得 style 物件的輔助函式
        const getStyle = (styleId: number) => styles[styleId] || {};
        // 填入資料
        Object.entries(sheetData.rows || {}).forEach(([rowIdx, rowData]) => {
            if (rowIdx === "len") return; // 跳過 len 屬性
            const excelRow = ws.getRow(Number(rowIdx) + 1);
            if (typeof rowData === "object" && rowData !== null && "cells" in rowData) {
                Object.entries((rowData as XSpreadsheetRow).cells || {}).forEach(([colIdx, cellData]) => {
                    const cell = cellData as XSpreadsheetCell;
                    const excelCell = excelRow.getCell(Number(colIdx) + 1);
                    // 判斷是否為公式
                    if (cell.text != null && typeof cell.text === "string" && cell.text.startsWith("=")) {
                        excelCell.value = { formula: cell.text.slice(1) };
                    } else {
                        // 其他一律轉字串
                        excelCell.value = cell.text != null ? String(cell.text) : "";
                    }
                    // 取得 style
                    const style = getStyle(cell.style as number);
                    // 字型樣式處理
                    if (style.font) {
                        const ExcelExportstyle: Partial<ExcelJs.Font> = {}
                        if (style.font.bold) ExcelExportstyle.bold = style.font.bold;
                        // 正確取得 font.size 與 font.name
                        if (style.font.size) ExcelExportstyle.size = style.font.size;
                        if (style.font.name) ExcelExportstyle.name = style.font.name;
                        if (style.font.italic) ExcelExportstyle.italic = style.font.italic;
                        if (style.strike) ExcelExportstyle.strike = style.strike;
                        if (style.underline) ExcelExportstyle.underline = style.underline;
                        if (style.color) ExcelExportstyle.color = { argb: style.color.replace("#", "") };
                        // 若有任何字型屬性才設定
                        if (Object.keys(ExcelExportstyle).length) excelCell.font = ExcelExportstyle;
                    }
                    // 背景色
                    if (style.bgcolor) {
                        excelCell.fill = {
                            type: "pattern",
                            pattern: "solid",
                            fgColor: { argb: style.bgcolor.replace("#", "") }
                        };
                    }
                    // 對齊
                    if (style.textwrap || style.align || style.valign) {
                        excelCell.alignment = {
                            wrapText: !!style.textwrap,
                            horizontal: style.align || undefined,
                            vertical: style.valign || undefined
                        };
                    }
                    // 邊框
                    if (style.border) {
                        // 允許的邊框樣式
                        const allowedBorderStyles = [
                            "thin", "dotted", "dashDot", "hair", "dashDotDot", "slantDashDot", "mediumDashed",
                            "mediumDashDotDot", "mediumDashDot", "medium", "double", "thick"
                        ] as const;
                        type BorderStyle = typeof allowedBorderStyles[number];
                        // 將 [style, color] 轉換為 exceljs 的格式
                        const convertBorder = (b?: [string, string]) => {
                            if (!b) return undefined;
                            const style = allowedBorderStyles.includes(b[0] as BorderStyle) ? b[0] as BorderStyle : "thin";
                            // color 需補上 alpha 通道
                            let argb = "FF000000"; // 預設黑色
                            if (b[1]) {
                                const hex = b[1].replace("#", "");
                                if (hex.length === 6) {
                                    argb = "FF" + hex.toUpperCase();
                                }
                            }
                            return { style, color: { argb } };
                        };
                        // 設定四邊的邊框，若無則為 undefined
                        excelCell.border = {
                            top: convertBorder(style.border.top),
                            bottom: convertBorder(style.border.bottom),
                            left: convertBorder(style.border.left),
                            right: convertBorder(style.border.right)
                        };
                    }
                });
            }
        });
        // 合併儲存格處理
        if (sheet.merges) {
            sheet.merges.forEach(range => {
                ws.mergeCells(range);
            });
        }

        // 凍結窗格處理
        if (sheet.freeze) {
            // 將 x-spreadsheet 的凍結格式轉換為 ExcelJS 格式
            const freezeCell = sheet.freeze;
            if (typeof freezeCell === 'string') {
                // 如果是字串格式 (如 "B3")，需要解析為行列索引
                const colToIndex = (col: string) =>
                    col.split("").reduce((r, c) => r * 26 + c.charCodeAt(0) - 64, 0);
                
                const match = freezeCell.match(/^([A-Z]+)(\d+)$/);
                if (match) {
                    const colStr = match[1];
                    const rowStr = match[2];
                    const colIndex = colToIndex(colStr) - 1; // 轉為 0-based
                    const rowIndex = parseInt(rowStr) - 1; // 轉為 0-based
                    
                    ws.views = [{
                        state: 'frozen',
                        xSplit: colIndex,
                        ySplit: rowIndex,
                        topLeftCell: freezeCell
                    }];
                }
            } else if (Array.isArray(freezeCell)) {
                // 如果是陣列格式 [row, col]
                const [rowIndex, colIndex] = freezeCell;
                const colToLetter = (col: number) => {
                    let result = '';
                    while (col >= 0) {
                        result = String.fromCharCode(65 + (col % 26)) + result;
                        col = Math.floor(col / 26) - 1;
                    }
                    return result;
                };
                
                const topLeftCell = `${colToLetter(colIndex)}${rowIndex + 1}`;
                ws.views = [{
                    state: 'frozen',
                    xSplit: colIndex,
                    ySplit: rowIndex,
                    topLeftCell: topLeftCell
                }];
            }
        }

        //測試字型樣式（範例，實際可移除）
        // ws.getCell('A1').value = "樣式測試";
        // ws.views = [{
        //     state:'frozen',
        //     xSplit:2,
        // }];
        // ws.getCell('A1').font = {
        //     name: 'Lato',
        //     color: { argb: 'FF00FF00' },
        //     family: 2,
        //     size: 20,
        //     bold: true,
        //     italic: true,
        //     underline: true,
        //     strike: true,
        // };
    });

    return wb;
}
