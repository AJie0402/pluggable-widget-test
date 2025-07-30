declare module "cypress-image-diff-js/dist/plugin" {
    declare function getCompareSnapshotsPlugin(on, config): void;
    export = getCompareSnapshotsPlugin;
}

declare module "cypress-image-diff-js/dist/command" {
    declare function compareSnapshotCommand(): void;
    export = compareSnapshotCommand;
}
//引用模組,型別宣告
declare module "x-data-spreadsheet/src/core/font" {
    //字型  
      export interface BaseFont {
        key: string;
        title: string;
      }
    //字體
      export interface FontSize {
        pt: number;
        px: number;
      }
    
      export const baseFonts: BaseFont[];
      export const fontSizes: FontSize[];
      export function fonts(ary?: BaseFont[]): Record<string, BaseFont>;
      export function getFontSizePxByPt(pt: number): number;
}
declare module 'x-data-spreadsheet/src/locale/en' {
  const en: {
    contextmenu: {};
  };
  export default en;
}
