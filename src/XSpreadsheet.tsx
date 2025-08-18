import { useRef, useEffect, useState } from "react";
import { XSpreadsheetContainerProps } from "../typings/XSpreadsheetProps";
import Spreadsheet from "x-data-spreadsheet";
import ExcelJs from "exceljs";
import { stoxExceljs } from "./xlsxspread.min";
import "x-data-spreadsheet/dist/xspreadsheet.css";
import useGoogleFontsWithXspread from "./components/useGoogleFontsWithXspread";
import createcontextNewmenu from "./components/createcontextNewmenu"; 
import { CustomExportToolbar} from "./components/CustomExportToolBar";
// 定義 props 的型別介面
export default function MendixSpreadsheet({
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
    const NewbaseFonts = useGoogleFontsWithXspread();
    const NewRightMouse = createcontextNewmenu();
    
    var apic;


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

                    apic = availablefile.value.uri;

                    // 1. 解析 Excel
                    const workbook = new ExcelJs.Workbook();
                    await workbook.xlsx.load(arrayBuffer);

                    // 2. 轉換成 spreadsheet 格式
                    const data = stoxExceljs(workbook, apic);
                    // 3. 顯示在 x-data-spreadsheet
                    if (!el.current || !NewbaseFonts.length ||!NewRightMouse) return;
                    
                    // 設置自定義的 context menu
                    if (typeof window !== 'undefined') {
                        (window as any).x_spreadsheet = {
                            ...(window as any).x_spreadsheet,
                            $messages: {
                                en: {
                                    ...(window as any).x_spreadsheet?.$messages?.en,
                                    contextmenu: NewRightMouse
                                }
                            }
                        };
                    }
                    
                    const s = new Spreadsheet(el.current, {
                        showToolbar: true,
                        extendToolbar:{
                            left: [
                                {
                                    tip: 'Save',
                                    icon: 'save', // 這個要看 x-data-spreadsheet 支援哪些 icon
                                    onClick: () => {
                                        alert('你點了Save 按鈕！');

                                    }
                                },
                                {
                                    tip: 'DownLoad',
                                    icon: 'DownLoad', // 這個要看 x-data-spreadsheet 支援哪些 icon
                                    onClick: () => {
                                        alert('你點了DownLoad 按鈕！');
                                    }
                                }
                            ],

                            right: [
                                {
                                    tip: 'UpdateLoad',
                                    icon: 'UpadeLoad',
                                    onClick: () =>{
                                        alert('你點了上傳paf');
                                    }
                                },
                                {
                                    tip: 'Percent',
                                    icon: 'Percent',
                                    onClick: () =>{
                                        alert('你點了百分比');
                                    }
                                }
                            ]
                            
                        },
                        view: {
                            height: () => document.documentElement.clientHeight,
                            width: () => document.documentElement.clientWidth - widthOffset
                        },
                        // 不要放 contextMenu 這個屬性
                        ...(!editable && ({
                            mode: "read",
                            showToolbar: false,
                            showGrid: false,
                            showContextmenu: true  // 改為 true 以啟用右鍵選單
                        })),
                    });

                    //s.setFileUri(apic);
                                       
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

    // 當 fileDocument 變動時，更新 availablefile / uri 狀態
    useEffect(() => {
        setFile(fileDocument);
    }, [fileDocument]);
    // useEffect(() => {
    //     setUri(availablefile.value.uri);
    // }, availablefile.value.uri);   


    return (
        <div>
            {/* 工具列，提供匯出/儲存等功能 */}
            {/* 若有自訂 Toolbar/字型選單元件，可這樣傳遞：
                <CustomToolbar fontList={fontList} ...其他props />
            */}
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
            <div id="gridctr" ref={el}/>
        </div>

    );
}