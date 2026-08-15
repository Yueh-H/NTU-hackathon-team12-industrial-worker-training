/** Demo parse result for the FM-DEMO / DEMO-001 manufacturing sheet. */
export const DEMO_SHEET = {
  title: "FM-DEMO 防火遮煙視窗扇生產製造表",
  docNo: "DEMO-001",
  formCode: "FM-DEMO",
  machine: "15-D9 子母扇 1724×2202",
  previewPath: "drawing.png",
  summary: "子母扇平面防火遮煙視窗扇的生產製造與裁折圖，含門扇尺寸、左右方向、五金與材料裁切清單。",
  rawContent: `工單 DEMO-001／表單 FM-DEMO
名稱：子母扇平面防火遮煙視窗扇
成品：1724×2202，8 組，顏色 8251，開外
母扇 1022×2202（加工 1074×2276）16 片，4 左／4 右
子扇 701×2202（加工 753×2276）16 片，4 左／4 右
板厚 1.0，門厚 50
鉸鏈側 48 mm 珍珠岩複合板；鎖側 40 mm 珍珠岩 + 2×4 mm 碳酸鎂
防火玻璃 31×226×1226，16 片
五金：防撬栓 TH-720、下降條 DW-900、旗形鉸鏈 OK-602-4"×3
內封邊 F-59，外封邊 F-17`
} as const;
