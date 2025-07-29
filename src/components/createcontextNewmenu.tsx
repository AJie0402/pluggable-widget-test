import { useEffect } from "react";
import en from "x-data-spreadsheet/src/locale/en";

const contextmenu: any = en.contextmenu;

const contextmenuName = [
  "UpDateload"
];

function createcontextNewmenu() {
  useEffect(() => {
    contextmenuName.forEach(menuName => {
      if (!contextmenu[menuName]) {
        contextmenu[menuName] = "UpDateload";  // 顯示名稱
      }
    });
  }, []);

  return contextmenu;
}

export default createcontextNewmenu;