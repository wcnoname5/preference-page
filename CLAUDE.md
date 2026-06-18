# CLAUDE.md

## 這個專案在做什麼

一個純前端的單頁網頁，用來練習 TypeScript。內容是一個 **2AFC（two-alternative
forced choice）偏好選擇實驗的 demo**：畫面呈現兩個選項，使用者反覆做「左 / 右」
選擇，背後的演算法依選擇更新數值，直到達成結束條件。

可直接部署到 GitHub Pages，使用者連上去即可使用，無需在本機架設環境。

設計目標是把「實驗外殼」和「演算法」分開：外殼通用、可重用，演算法透過介面抽換。


## Tech Stack

- **Vite + React + TypeScript + TailwindCSS**。
- 演算法用 TypeScript 實作（演算法內容幾乎只有四則運算），放在 `src/logic/`，
  與 React UI 完全分離，不碰 DOM。
- UI 在 `src/components/`，狀態經 `src/hooks/useExperiment.ts` 由
  `src/logic/experiment.ts`（headless controller）驅動。
- Tailwind v4 透過 `@tailwindcss/vite`，沒有 `tailwind.config.js`。
- 用 `npm run build`（`tsc -b && vite build`）輸出到 `dist/`。
- 部署：GitHub Pages（純靜態），Vite `base` 設為 `/preference-page/`。

## 開發指令

- `npm run dev`：本機開發（localhost）。
- `npm run build`：型別檢查 + 打包到 `dist/`。
- `npm run smoke`：用 controller 跑一輪完整 HaB 流程的煙霧測試。

## 注意事項

- 作者正在練習 TypeScript，請偏好清楚、易讀、慣用的寫法，必要時補充說明。
- 用 ES module，必須透過 `http://localhost`（或部署網址）開啟，不能直接雙擊 html。
