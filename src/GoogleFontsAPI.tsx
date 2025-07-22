import { useEffect, useState } from "react";
import { baseFonts } from "x-data-spreadsheet/src/core/font";

// 請填入你自己的 Google Fonts API Key
const GOOGLE_FONTS_API_KEY = "AIzaSyBpRElAojMJsD-5hSGcbcZYYyLZXQkgkL8";
const GOOGLE_FONTS_API = `https://www.googleapis.com/webfonts/v1/webfonts?key=${GOOGLE_FONTS_API_KEY}`;

function useAllGoogleFontsWithXspread() {
  const [allFonts, setAllFonts] = useState(baseFonts);

  useEffect(() => {
    // 只 fetch 一次
    fetch(GOOGLE_FONTS_API)
      .then(res => res.json())
      .then(data => {
        if (data.items) {
          let changed = false;
          data.items.forEach((font: { family: string }) => {
            if (!baseFonts.find(f => f.key === font.family)) {
              baseFonts.push({ key: font.family, title: font.family });
              changed = true;
            }
          });
          if (changed) setAllFonts([...baseFonts]);
        }
      });
  }, []);

  // 回傳已加到 baseFonts 的所有字體
  return allFonts;
}

export default useAllGoogleFontsWithXspread;
// 載入的 Google Fonts
// const googleFontNames = ["Roboto", "Noto Sans TC"];

// function useGoogleFontsWithXspread() {
//   // 1. 載入 Google Fonts CDN
//   const googleFontsUrl = useMemo(() => {
//     const families = googleFontNames.map((f) => f.replace(/ /g, "+")).join("|");
//     return `https://fonts.googleapis.com/css?family=${families}&display=swap`;
//   }, []);

//   useEffect(() => {
//     if (!document.querySelector(`link[href="${googleFontsUrl}"]`)) {
//       const link = document.createElement("link");
//       link.rel = "stylesheet";
//       link.href = googleFontsUrl;
//       document.head.appendChild(link);
//     }
//   }, [googleFontsUrl]);

//   // 2. 動態把 Google 字體加進 baseFonts
//   useEffect(() => {
//     googleFontNames.forEach(fontName => {
//       if (!baseFonts.find(f => f.key === fontName)) {
//         baseFonts.push({ key: fontName, title: fontName });
//       }
//     });
//   }, []);

//   // 3. 回傳
//   return baseFonts;
// }

// export default useGoogleFontsWithXspread;
