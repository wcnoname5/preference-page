# Adaptive Methods for Indifference Point Elicitation

> English | [繁體中文](README.zh-TW.md)

A front-end web page that measures a participant's value (utility) function through repeated binary choices, and estimates their loss aversion.

Two main features are implemented in this project:

1. The trade-off experiment from [Abdellaoui et al. (2016)](https://doi.org/10.1007/s11166-016-9234-y), which provides a non-parametric procedure to estimate one's loss aversion.

2. *Adaptive updating algorithms* in the choice-based indifference point elicitation.

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

The rule that updates the target after each choice is crucial — and the focus of this
demo.

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
    -  The **Details** table logs each iteration's target value, step size, and working bounds.

3. **Slider finish (BiM-S only).** When `BiM-S` reaches its stop criterion, a slider appears so you can fine-tune the final indifference value directly.

4. **Next round.** Each elicited value feeds into the next task, so the experiment walks
   through all the targets one by one.

5. **Results.** After the last target, a chart plots the elicited value function, the full sequence is listed, and the loss-aversion indices are shown.

### Updating algorithms

See [this thesis](https://doi.org/10.6342/NTU202501601) for algorithm details and the comparison behind the choices here:

- **BiM** (Bisection Method).
- **BiM-S** (a slider variant of BiM)
- **HaB** (Halved method of Bisection; named *SimpBisection* in the thesis)
- **ASA** (Accelerated Stochastic Approximation)

Other methods compared in the thesis are not implemented here due to their performance.

## Tech Stack

- **TypeScript**, compiled with `tsc` to plain ES modules — no front-end framework;
  [Chart.js](https://www.chartjs.org/) (via CDN) for the result plot.

## Local Development and Testing

One-time setup:
```bash
npm install -D typescript
npx tsc --init
```

For local development (compile in watch mode + serve over http):
```bash
npx tsc --watch
npx serve
```
