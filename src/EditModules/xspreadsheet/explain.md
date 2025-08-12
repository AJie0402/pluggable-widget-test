cell.js 新增運算子 (平方計算)
helper.js 運算子運算判斷
--------------------------
sheet.js 新增撈取參數 && Guid 導入mendix action 
index.js 新增btn格式 會需要至 index.d.ts 模組宣告 

格式新增 ：
說明: 是一個陣列 , 新增位置 , title , icon , 以及function
 extendToolbar?: {
      left?: Array<{
          tip: string;
          icon: string;
          onClick: () => void;
      }>;
      right?: Array<{
          tip: string;
          icon: string;
          onClick: () => void;
      }>;
  };
