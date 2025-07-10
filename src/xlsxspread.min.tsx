import * as XLSX from "xlsx-js-style";

/**
 * 將 XLSX.WorkBook 轉換為 x-spreadsheet 的資料格式
 */
export function stox(
    wb: XLSX.WorkBook
): Array<{
    name: string;
    rows: { [key: number]: { cells: { [key: number]: { text?: string; merge?: [number, number] } } } } & {
        len?: number;
    };
    merges: string[];
}> {
    const out: Array<{
        name: string;
        rows: { [key: number]: { cells: { [key: number]: { text?: string; merge?: [number, number] } } } } & {
            len?: number;
        };
        merges: string[];
    }> = [];
    wb.SheetNames.forEach(function (name) {
        // 每個 sheet 轉成 x-spreadsheet 格式
        const o = { name: name, rows: {}, merges: [] } as {
            name: string;
            rows: { [key: number]: { cells: { [key: number]: { text?: string; merge?: [number, number] } } } } & { len?: number };
            merges: string[];
        };
        const ws = wb.Sheets[name];
        if (!ws || !ws["!ref"]) return;
        const range = XLSX.utils.decode_range(ws["!ref"]);
        range.s = { r: 0, c: 0 };
        const aoa = XLSX.utils.sheet_to_json(ws, { raw: false, header: 1, range: range });
        aoa.forEach(function (r: any[], i: number) {
            const cells: { [key: number]: { text?: string; merge?: [number, number] } } = {};
            r.forEach(function (c, j) {
                cells[j] = { text: c || String(c) };
                const cellRef = XLSX.utils.encode_cell({ r: i, c: j });
                if (ws[cellRef] != null && ws[cellRef].f != null) {
                    cells[j].text = "=" + ws[cellRef].f;
                }
            });
            o.rows[i] = { cells: cells };
        });
        o.rows.len = aoa.length;
        (ws["!merges"] || []).forEach(function (merge: any, i: number) {
            if (o.rows[merge.s.r] == null) {
                o.rows[merge.s.r] = { cells: {} };
            }
            if ((o.rows[merge.s.r].cells as any)[merge.s.c] == null) {
                (o.rows[merge.s.r].cells as any)[merge.s.c] = {};
            }
            (o.rows[merge.s.r].cells as any)[merge.s.c].merge = [merge.e.r - merge.s.r, merge.e.c - merge.s.c];
            o.merges[i] = XLSX.utils.encode_range(merge);
        });
        out.push(o);
    });
    return out;
}

/**
 * x-spreadsheet 資料格式轉回 XLSX.WorkBook
 */
type XSheet = {
    name: string;
    rows: {
        [key: number]: {
            cells: {
                [key: number]: {
                    text?: string;
                    style?: number;
                    merge?: [number, number];
                };
            };
        };
        len?: number;
    };
    styles: { [key: number]: { [key: string]: any } };
};

/**
 * 將 x-spreadsheet 的資料轉為 XLSX.WorkBook
 * @param sdata x-spreadsheet 資料陣列
 * @param keepMerges 是否保留合併儲存格
 * @param keepFormulas 是否保留公式
 */
export function xtos(sdata: XSheet[], keepMerges = true, keepFormulas = true): XLSX.WorkBook {
    // 轉換 x-spreadsheet style 為 xlsx-js-style style
    function transformStyle(styleObj: { [key: string]: any }): { [key: string]: any } {
        const result: { [key: string]: any } = {};
        if (styleObj)
            Object.keys(styleObj).map(key => {
                switch (key) {
                    case "align":
                        result["alignment"] = Object.assign(result["alignment"] || {}, { horizontal: styleObj[key] });
                        break;
                    case "valign":
                        result["alignment"] = Object.assign(result["alignment"] || {}, { vertical: styleObj[key] });
                        break;
                    case "font":
                        result["font"] = Object.assign(result["font"] || {}, styleObj[key]);
                        if (result["font"] && result["font"]["size"])
                            result["font"] = Object.assign(result["font"] || {}, { sz: styleObj[key]["size"] });
                        break;
                    case "underline":
                        result["font"] = Object.assign(result["font"] || {}, { underline: styleObj[key] });
                        break;
                    case "strike":
                        result["font"] = Object.assign(result["font"] || {}, { strike: styleObj[key] });
                        break;
                    case "color":
                        result["font"] = Object.assign(result["font"] || {}, {
                            color: { rgb: styleObj[key].slice(1) }
                        });
                        break;
                    case "bgcolor":
                        result["fill"] = Object.assign(result["fill"] || {}, {
                            fgColor: { rgb: styleObj[key].slice(1) },
                            patternType: "solid"
                        });
                        break;
                    case "border":
                        result["border"] = Object.assign(result["border"] || {}, {
                            top: styleObj[key]["top"]
                                ? { style: styleObj[key]["top"][0], color: { rgb: styleObj[key]["top"][1].slice(1) } }
                                : null,
                            bottom: styleObj[key]["bottom"]
                                ? {
                                      style: styleObj[key]["bottom"][0],
                                      color: { rgb: styleObj[key]["bottom"][1].slice(1) }
                                  }
                                : null,
                            left: styleObj[key]["left"]
                                ? { style: styleObj[key]["left"][0], color: { rgb: styleObj[key]["left"][1].slice(1) } }
                                : null,
                            right: styleObj[key]["right"]
                                ? {
                                      style: styleObj[key]["right"][0],
                                      color: { rgb: styleObj[key]["right"][1].slice(1) }
                                  }
                                : null
                        });
                        break;
                    case "textwrap":
                        result["alignment"] = Object.assign(result["alignment"] || {}, { wrapText: styleObj[key] });
                        break;
                    default:
                }
            });
        return result;
    }
    // 轉換格式字串
    function formatText(styleObj: { [key: string]: any }): string {
        let format = "";
        if (styleObj)
            Object.keys(styleObj).map(key => {
                if ("format" === key) {
                    switch (styleObj[key]) {
                        case "scientific":
                            format = "0.00E+0";
                            break;
                        case "percent":
                            format = "0.00%";
                            break;
                        case "number":
                            format = "0.00";
                            break;
                        default:
                    }
                }
            });
        return format;
    }
    const out = XLSX.utils.book_new();
    sdata.forEach(xws => {
        const ws: XLSX.WorkSheet = {};
        const rowobj = xws.rows;
        let minCoord = { r: 0, c: 0 }, maxCoord = { r: 0, c: 0 };
        for (let ri = 0; ri < rowobj.len!; ++ri) {
            const row = rowobj[ri];
            if (!row) continue;
            Object.keys(row.cells).forEach(k => {
                const idx = +k;
                if (isNaN(idx)) return;
                const lastRef = XLSX.utils.encode_cell({ r: ri, c: idx });
                // 計算範圍
                if (minCoord === undefined) {
                    minCoord = { r: ri, c: idx };
                } else {
                    if (ri < minCoord.r) minCoord.r = ri;
                    if (idx < minCoord.c) minCoord.c = idx;
                }
                if (maxCoord === undefined) {
                    maxCoord = { r: ri, c: idx };
                } else {
                    if (ri > maxCoord.r) maxCoord.r = ri;
                    if (idx > maxCoord.c) maxCoord.c = idx;
                }
                // 內容與型別判斷
                let cellText = (row.cells as any)[k].text,
                    type: "s" | "n" | "b" | "z" = "s";
                if (!cellText) {
                    cellText = "";
                    const styleIndex = (row.cells as any)[k].style;
                    if (undefined === styleIndex || null === styleIndex) {
                        type = "z";
                    }
                    if (
                        undefined !== styleIndex &&
                        xws.styles[styleIndex] &&
                        xws.styles[styleIndex]["format"] &&
                        "scientific" === xws.styles[styleIndex]["format"]
                    ) {
                        cellText = 0;
                        type = "n";
                    }
                } else if (!isNaN(parseFloat(cellText))) {
                    cellText = parseFloat(cellText);
                    type = "n";
                } else if (cellText === "true" || cellText === "false") {
                    cellText = Boolean(cellText);
                    type = "b";
                }
                (ws as any)[lastRef] = {
                    v: cellText,
                    t: type,
                    z: formatText(xws.styles[(row.cells as any)[k].style]),
                    s: transformStyle(xws.styles[(row.cells as any)[k].style])
                };
                // 公式處理
                if (keepFormulas && type === "s" && typeof cellText === "string" && cellText[0] === "=") {
                    (ws as any)[lastRef].f = cellText.slice(1);
                }
                // 合併儲存格
                if (keepMerges && (row.cells as any)[k].merge !== undefined) {
                    if ((ws as any)["!merges"] === undefined) (ws as any)["!merges"] = [];
                    (ws as any)["!merges"].push({
                        s: { r: ri, c: idx },
                        e: {
                            r: ri + (row.cells as any)[k].merge![0],
                            c: idx + (row.cells as any)[k].merge![1]
                        }
                    });
                }
            });
            (ws as any)["!ref"] =
                XLSX.utils.encode_cell({ r: minCoord.r, c: minCoord.c }) +
                ":" +
                XLSX.utils.encode_cell({ r: maxCoord.r, c: maxCoord.c });
        }
        XLSX.utils.book_append_sheet(out, ws, xws.name);
    });
    return out;
}

/**
 * 將 x-spreadsheet 物件匯出為 XLSX.WorkBook 並於 console.log 顯示
 */
export function exportSheet(sheet: { getData: () => XSheet[] }, _filename: string) {
    const new_wb = xtos(sheet.getData());
    console.log(new_wb);
}
