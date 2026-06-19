# Adaptive Methods for Indifference Point Elicitation

> English | [繁體中文](#適測性方法用於無異點測量) | 🔗 **[Live demo](https://wcnoname5.github.io/preference-page/)**

A web-based experiment for measuring value (utility) functions, featuring several adaptive algorithms for indifference point elicitation. 

This project implements the following from [my master's thesis](https://doi.org/10.6342/NTU202501601):

1. The trade-off experiment from [Abdellaoui et al. (2016)](https://doi.org/10.1007/s11166-016-9234-y), which measures one's loss aversion by eliciting a sequence of indifference points.

2. **Adaptive methods** for choice-based indifference point elicitation.

## Introduction & Motivation

In preference research, one often needs to locate an **indifference point** — the value at which the two options are equally attractive to a person.

As a simple example, consider two options:
- a bet with a 50% chance of winning \$100 and a 50% chance of winning $0,
- a certain amount $\$T$.

For what value $T$ is the person *indifferent* between them?
- If $T<50$ (below the bet's expected value) we call them risk-averse;
- if $T>50$, risk-seeking.

So locating $T$ lets us infer risk attitude.

### Question: *How do we find the indifference point?*

One way is to ask for it directly (*matching*), but this tends to be biased
([Tversky et al. 1990](https://www.jstor.org/stable/2006743);
[Bostic et al. 1990](https://doi.org/10.1016/0167-2681(90)90086-S)).

A more reliable way is **choice-based**: present two options, let the participant pick the
preferred one, and adjust a **target value** up or down based on that choice. Repeat until
a stop criterion is met.

> For example, start with $T=\$50$. If the participant prefers the certain amount, lower
> $T$; if they prefer the bet, raise $T$. Present the updated options next time, and so on.

The rule that updates the target after each choice is crucial — this demo features several *adaptive algorithms* for this update step.

## Experiment

### What is measured

Following [Abdellaoui et al. (2016)](https://doi.org/10.1007/s11166-016-9234-y) (including the monetary values used in each task), the experiment elicits a sequence of gain and loss
outcomes.
- The points in the sequence are equally spaced in utility, which traces out the value function.
- From that sequence it reports two loss-aversion indices and classifies the participant as loss-averse, gain-seeking, or neutral.

### How to play

1. **Setup.** On the start screen, choose:
   - **Updating algorithm** — `HaB`, `ASA`, `BiM`, or `BiM-S`.
   - **Stop criterion:**
        - A fixed number of iterations
        - Convergence (stop once the step size drops below a threshold).
   - **Initial point / boundary scheme:** 
        - *Equal-expectation* (start where the two options have equal expected value)
        - *Fixed Boundary Width* (a fixed-width starting interval of 5000,  used by `BiM` / `BiM-S`).

2. **Make choices.** Each trial shows two options (**left** / **right**). Pick whichever option is more attractive to you.
    -  The **Details** table logs each iteration's target value, step size, and working bounds. These logs help illustrate how the algorithm works in practice.
3. **Slider finish (BiM-S only).** When `BiM-S` reaches its stop criterion, a slider appears so you can fine-tune the final indifference value directly.

4. **Next round.** Each elicited value feeds into the next task, so the experiment walks
   through all the targets one by one.

5. **Results.** After the last target, a chart plots the elicited value function, the full sequence is listed, and the loss-aversion indices are shown.

### Updating algorithms

Four updating algorithms are implemented in this demo:

- **BiM** (Bisection Method).
- **BiM-S** (a slider variant of BiM)
- **HaB** (Halved method of Bisection; named *SimpBisection* in the thesis)
- **ASA** (Accelerated Stochastic Approximation)

Details about the algorithms and setup (stopping criterion, initial points determination rules) are described in [my thesis](https://doi.org/10.6342/NTU202501601). Other algorithms compared in the thesis are excluded here as they were outperformed.

## Tech Stack

- **Vite + React + TypeScript + TailwindCSS**.
- The elicitation algorithms live in `src/logic/` as framework-agnostic
  TypeScript, fully separated from the React UI in `src/components/`.
- [Chart.js](https://www.chartjs.org/) (via [react-chartjs-2](https://react-chartjs-2.js.org/)) for the result plot.
- Deploys to GitHub Pages as a static site (Vite `base` = `/preference-page/`).

## Local Development and Testing

One-time setup:
```bash
npm install
```

For local development:
```bash
npm run dev
```

Production build and smoke check:
```bash
npm run build   # type-check + bundle into dist/
npm run smoke   # run a full HaB elicitation through the controller
```
---

# 適測性方法用於無異點測量

> [English](#adaptive-methods-for-indifference-point-elicitation) | 繁體中文 | 🔗 **[Live demo](https://wcnoname5.github.io/preference-page/)**

展示用於測量受試者的效用函數的網頁實驗，並提供多種無異點測量的演算法。

此專案實作[我的碩論](https://doi.org/10.6342/NTU202501601)中提及的以下內容：

1. [Abdellaoui et al. (2016)](https://doi.org/10.1007/s11166-016-9234-y) 的 trade-off 實驗，透過測得一連串無異點，來測量一個人的損失趨避(loss aversion)。

2. 用於估計無異點的 **適測性(adaptive)方法**。

## 簡介與動機

在偏好研究中，我們常需要找出一個**無異點(indifference point)**——也就是兩個選項讓一個人相等吸引的數值。

舉一個簡單的例子，考慮兩個選項：
- 一個賭局，有 50% 獲得 \$100，50% 獲得 \$0，
- 一筆確定金額 $\$T$。

$T$ 在哪個數值下，這個人會認為兩者*無異*？
- 若 $T<50$（低於賭局的期望值），我們稱此為風險趨避；
- 若 $T>50$，則為風險愛好。

因此，找出 $T$ 就能讓我們推論其風險態度。

### 問題：*我們要如何找出無異點？*

一種方式是直接詢問（*matching*，配對法），但這會有偏誤
（[Tversky et al. 1990](https://www.jstor.org/stable/2006743)；
[Bostic et al. 1990](https://doi.org/10.1016/0167-2681(90)90086-S)）。

更可靠的方式是**基於使用者的序列選擇**：呈現兩個選項，讓受試者挑出較偏好的一個，並依其選擇將**目標值**往上或往下調整。如此反覆，直到滿足終止條件。

> 例如，一開始呈現 $T=\$50$。若受試者偏好確定金額，就調低 $T$；若偏好賭局，就調高 $T$。下一次再呈現更新後的選項，依此類推。

每次選擇後用來更新目標值的規則，正是關鍵所在——此專案展示不同的**適測方法**進行更新。

## 實驗

### 測量什麼

依循 [Abdellaoui et al. (2016)](https://doi.org/10.1007/s11166-016-9234-y)（包含相關選項的金額設定），實驗會推估出一系列收益與損失的結果值。
- 序列中的各點在效用上是等距的，藉此描繪出價值函數。
- 從這個序列中，會回報兩個損失趨避指標，並將受試者分類為損失趨避（loss-averse）、收益愛好（gain-seeking）或中性（neutral）。

### 怎麼玩

1. **設定。** 在起始畫面中選擇：
   - **更新演算法**——`HaB`、`ASA`、`BiM` 或 `BiM-S`。
   - **終止條件：**
        - 固定的 iteration 次數
        - 收斂（當 step size 低於門檻時停止）。
   - **初始值／區間方案：**
        - *Equal-expectation*（從兩個選項期望值相等之處開始）
        - *Fixed Boundary Width*（固定寬度為 5000 的初始區間，用於 `BiM` / `BiM-S`）。

2. **做選擇。** 每一個 trial 會顯示兩個選項（**左** / **右**）。挑出對你而言較有吸引力的那個。
    - **Details** 表格提供每個 iteration 的目標值、step size 與目前區間，以實際數值幫助理解演算法實作。

3. **滑桿收尾（僅 BiM-S）。** 當 `BiM-S` 達到終止條件時，會出現一個滑桿，讓你直接微調最終的無異值。

4. **下一回合。** 每個推估出的數值會接續輸入下一個回合，使實驗逐一走過所有目標。

5. **結果。** 測量完最後一個目標後，會呈現圖表繪出估計的價值函數、列出完整序列，並顯示損失趨避指標。

### 更新演算法

此示範網站中共實作四種演算法：

- **BiM**（Bisection Method，二分法）。
- **BiM-S**（BiM 的 slider 變體）
- **HaB**（Halved method of Bisection；在論文中稱為 *SimpBisection*）
- **ASA**（Accelerated Stochastic Approximation）

演算法與設定(終止條件、初始值)細節說明請見[論文](https://doi.org/10.6342/NTU202501601)。論文中比較的其餘演算法，因模擬實驗表現較差，未在此實作。

## 技術棧

- **Vite + React + TypeScript + TailwindCSS**。
- 推估演算法放在 `src/logic/`，為與框架無關的純 TypeScript，
  與 `src/components/` 的 React UI 完全分離。
- 結果圖表使用 [Chart.js](https://www.chartjs.org/)（透過 [react-chartjs-2](https://react-chartjs-2.js.org/)）。
- 以靜態網站部署到 GitHub Pages（Vite `base` = `/preference-page/`）。

## 本機開發與測試

一次性設定：
```bash
npm install
```

本機開發：
```bash
npm run dev
```

正式打包與smoke test：
```bash
npm run build   # 型別檢查 + 打包到 dist/
npm run smoke   # 用 controller 跑一輪完整的 HaB 推估流程
```
