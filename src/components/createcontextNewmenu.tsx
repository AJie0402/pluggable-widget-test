import { useEffect } from "react";
import en from "x-data-spreadsheet/src/locale/en";


const contextmenu: any = en.contextmenu;


  const contextmenuName =[
    "UpDateload"
  ]

function createcontextNewmenu() {
  useEffect(() => {
    contextmenuName.forEach(fontName => {
      if (!contextmenu[fontName]) {
        contextmenu[fontName] = fontName;
      }
    });
  }, []);


    return contextmenu;
  }
export default createcontextNewmenu;