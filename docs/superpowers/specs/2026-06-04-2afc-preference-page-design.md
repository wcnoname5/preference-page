# 2AFC 偏好選擇實驗頁 — 設計規格

日期：2026-06-04

## 目標

做一個純前端單頁網頁（2AFC, two-alternative forced choice 偏好選擇實驗的 demo），
可直接部署到 GitHub Pages，連上即可使用，無需本機環境。

這份 spec 刻意寫得**一般性、可重用**：把網頁描述成一個通用的「強迫選擇實驗外殼」，
具體的演算法與結束條件當成可抽換的介面。第一版只需放一個能跑的最小實作，其餘留待
之後逐一補上。

## 設計原則

把系統拆成三個各自單一職責、透過明確介面溝通的部分。外殼不關心演算法細節；演算法
不關心畫面如何呈現。

| 層 | 職責 | 不需要知道的事 |
|---|---|---|
| **設定層** Setup | 開始前讓使用者選參數，產生一個 `ExperimentConfig` | 演算法內部怎麼算 |
| **實驗迴圈** Runner | 跑「呈現 → 等選擇 → 更新 → 判斷結束」的迴圈 | 演算法與結束條件的內部實作（只透過介面呼叫） |
| **顯示層** View | 把當前狀態畫到畫面、收點擊、即時更新 debug 表格 | 演算法、結束條件 |

## 資料模型

```typescript
// 一次呈現給受試者的兩個選項。
// 第一版固定每個選項兩欄 payoff（A、B）；之後若要增減，改這個型別即可。
interface Alternatives {
  left:  { payoffA: number; payoffB: number };
  right: { payoffA: number; payoffB: number };
}

// 受試者選了哪邊
type Selection = "left" | "right";

// 演算法在迭代間需要保存的狀態（決定更新量大小）
interface AlgorithmState {
  stage: number;
  iteration: number;
  stepSize: number;
}
```

## 可抽換的介面

### 更新演算法

```typescript
interface UpdateAlgorithm {
  readonly name: string;

  // 初始化：回傳第一輪要顯示的數值與初始狀態
  init(): { alternatives: Alternatives; state: AlgorithmState };

  // 根據這次選擇，計算下一輪要顯示的數值與新狀態。
  // 注意：由「演算法自己」決定要改哪一格 —— 它回傳完整的下一輪 Alternatives，
  //       外殼不寫死「只更新 right.payoffB」。這是可重用性的關鍵。
  next(
    current: Alternatives,
    state: AlgorithmState,
    selection: Selection
  ): { alternatives: Alternatives; state: AlgorithmState };
}
```

- 每個具體演算法為 `class AlgoX implements UpdateAlgorithm { ... }`。
- 內容幾乎不超過四則運算。
- 候選演算法（placeholder 名稱，之後實作）：BiM、ASA、HaB、BiM-S。

### 結束條件

```typescript
interface StopCondition {
  readonly name: string;
  // 看當前狀態，回傳是否該結束
  isDone(state: AlgorithmState): boolean;
}
```

- 兩種實作：
  - **固定 iteration**：`iteration >= N` 時結束。
  - **收斂**：`stepSize < Threshold` 時結束。

## 設定資料

```typescript
interface ExperimentConfig {
  algorithm: UpdateAlgorithm;   // 依設定層 radio 選擇 new 對應 class
  stopCondition: StopCondition; // 依設定層 radio 建立
}
```

## 畫面與流程

### 1. 設定區（實驗開始前）
- 一組 **radio**：選擇更新演算法（BiM / ASA / HaB / BiM-S）。
- 一組 **radio**：選擇結束條件（固定 iteration 數 / 收斂）。
  - 對應的參數欄位（N 或 Threshold）。
- 一個 **Start 按鈕**：按下後依設定建立 `ExperimentConfig`，進入實驗主畫面。

### 2. 實驗主畫面
- 中央呈現**兩個選項（左 / 右）**，每個選項顯示 payoffA、payoffB。
- 下方兩個**選擇鈕**：「選左」「選右」。
- 最下方一個 **debug 表格**，即時記錄每一輪，三欄：`stage` / `iteration` / `stepSize`。
- 使用者做出選擇後：
  1. Runner 呼叫 `algorithm.next(...)` 取得下一輪 Alternatives 與新狀態。
  2. View 重畫選項、在 debug 表格新增一列。
  3. Runner 呼叫 `stopCondition.isDone(state)`；若結束則顯示結束畫面，否則進入下一輪。

## 檔案結構（初步）

```
/
├── index.html
├── style.css
└── src/
    ├── main.ts          # 進入點：接設定層、建立 Runner
    ├── types.ts         # Alternatives / Selection / AlgorithmState / 介面
    ├── algorithms.ts    # 各 UpdateAlgorithm 實作
    └── stopConditions.ts# 各 StopCondition 實作
```
（編譯後產生對應 `.js`。）

## 開發與部署

一次性設定：
```bash
npm install -D typescript
npx tsc --init
```

每次開發：
```bash
npx tsc --watch   # 分頁1：自動編譯
npx serve         # 分頁2：用 http://localhost 開啟（ES module 不能直接雙擊 html）
```

部署：`tsc` 編譯 → push 到 GitHub Pages（純靜態）。

## 範圍（第一版 / 之後）

**第一版（最小可動）**
- 設定區 + 實驗主畫面 + debug 表格的完整外殼。
- 一個能跑的 placeholder 演算法 + 「固定 iteration」結束條件，讓頁面立刻能動。
- 資料只留在前端。

**之後（TODO，不在第一版）**
- 逐一實作 BiM / ASA / PEST / BiM-S 的 `init()` / `next()`。
- 「收斂」結束條件。
- 若要集中儲存數據：前端算完後 POST 結果（演算法仍留在前端）。
