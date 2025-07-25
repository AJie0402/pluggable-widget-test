import { useEffect, useMemo } from "react";
import { baseFonts } from "x-data-spreadsheet/src/core/font";

// 載入的 Google Fonts
const googleFontNames = [
  "Roboto",           // 英文常用
  "Noto Sans TC",     // 繁體中文
  "Noto Sans SC",     // 簡體中文
  "Noto Serif TC",    // 繁體中文襯線
  "Open Sans",        // 英文常用
  "Lato",             // 英文常用
  "Montserrat",       // 英文標題
  "Source Sans Pro",  // 英文常用
  "PT Sans",          // 英文常用
  "Oswald",           // 英文標題
  "Microsoft JhengHei", // Windows 繁中
  "PingFang TC",      // Mac 繁中
  "Arial",            // 系統常見
  "Helvetica Neue",   // Mac 常見
  // 以下為新增字體
  "Inter",            // 現代 UI 常用
  "Ubuntu",           // Linux 常見
  "Merriweather",     // 英文襯線
  "Poppins",          // 現代設計
  "Raleway",          // 英文標題
  "Quicksand",        // 圓潤現代
  "Fira Sans",        // 開發者常用
  "Inconsolata",      // 等寬字體
  "JetBrains Mono",   // 等寬字體
  "IBM Plex Sans",    // IBM 設計
  "DM Sans",          // 現代設計
  "Dancing Script",   // 英文手寫
  "Pacifico",         // 英文手寫
  "ZCOOL KuaiLe",     // 簡體中文
  "ZCOOL XiaoWei",    // 簡體中文
  "ZCOOL QingKe HuangYou", // 簡體中文
  "Noto Sans JP",     // 日文
  "Noto Sans KR",     // 韓文
  "Nanum Gothic",     // 韓文
  "Sarabun"           // 泰文
];

function useGoogleFontsWithXspread() {
  // 1. 載入 Google Fonts CDN
  const googleFontsUrl = useMemo(() => {
    const families = googleFontNames.map((f) => f.replace(/ /g, "+")).join("|");
    return `https://fonts.googleapis.com/css?family=${families}&display=swap`;
  }, []);

  useEffect(() => {
    if (!document.querySelector(`link[href="${googleFontsUrl}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = googleFontsUrl;
      document.head.appendChild(link);
    }
  }, [googleFontsUrl]);

  // 2. 動態把 Google 字體加進 baseFonts
  useEffect(() => {
    googleFontNames.forEach(fontName => {
      if (!baseFonts.find(f => f.key === fontName)) {
        baseFonts.push({ key: fontName, title: fontName });
      }
    });
  }, []);

  // 3. 回傳
  return baseFonts;
}
export default useGoogleFontsWithXspread;