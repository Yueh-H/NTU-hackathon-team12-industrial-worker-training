# Web App bridge

如果 Web App 沒有跑本機 Vite bridge，或要手動匯出，也可以用 export-training-status.js：

1. 在同一個瀏覽器開啟工訓 Web App，先進入要同步的員工頁面。
2. 開 DevTools Console，貼上 export-training-status.js 的內容並執行。
3. 下載的 learning-status.json 放到 ~/Library/Application Support/AIAlis/learning-status.json。
4. AI Alis 會在下一次輪詢讀到新狀態；也可以右鍵桌寵立即重新讀取。

這個 bridge 只讀目前瀏覽器的 shop-trainer-v2 localStorage，產出與 AI Alis schema 相容的本機 JSON；不會上傳資料。
