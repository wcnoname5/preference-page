# CLAUDE.md

## 這個專案在做什麼

一個純前端的單頁網頁，用來練習 TypeScript。內容是一個 **2AFC（two-alternative
forced choice）偏好選擇實驗的 demo**：畫面呈現兩個選項，使用者反覆做「左 / 右」
選擇，背後的演算法依選擇更新數值，直到達成結束條件。

可直接部署到 GitHub Pages，使用者連上去即可使用，無需在本機架設環境。

設計目標是把「實驗外殼」和「演算法」分開：外殼通用、可重用，演算法透過介面抽換。


## Tech Stack

- **HTML + CSS + TypeScript**，不使用任何前端框架。
- 演算法用 TypeScript 實作（演算法內容幾乎只有四則運算）。
- 用 `tsc` 把 `.ts` 編成 `.js`，連同 `.html` / `.css` 一起部署。
- 部署：GitHub Pages（純靜態）。

## 注意事項

- 作者正在練習 TypeScript，請偏好清楚、易讀、慣用的寫法，必要時補充說明。
- 用 ES module，必須透過 `http://localhost`（或部署網址）開啟，不能直接雙擊 html。
