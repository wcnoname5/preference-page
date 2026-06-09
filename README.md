# Bisection-based Methods for Utility Elicitation

A simple web page that runs a CPT-based tradeoff experiment for measuring a utility function and assessing loss aversion.

- It provides a runnable illustration of several updating algorithms in choice-based elicitation tasks.

## Introduction & Motivation

Consider a risk-attitude task. You are offered two options:
- a 50-50 bet paying \$100 or nothing,
- a certain amount $\$T$.

For what $T$ is the decision maker *indifferent* between them?
- If $T<50$ (below the bet's expectation) we call them risk-averse
- if $T>50$, risk-seeking.

So $T$ lets us infer risk attitude.


### *But how do we measure it?*

One way is to ask directly, which is known to be biased (Tversky et al. 1988, 1990). 

The alternative is **choice-based elicitation**: offer the bet against a certain value, and adjust that value up or down depending on each choice until it converges.

> For example, one set $T=\$50$ to the bet at first. If one prefer the certainty (bet), we decrease (increase) $T$ and present the options to the decision maker next time, so on and so forth. 

The algorithm to update the value based on last choice is crucial. hence we implement some updating rules in this illustration page.

## Description

The experiment follows [Abdellaoui et al. (2016)](https://doi.org/10.1007/s11166-016-9234-y). For eliciting each indifference point it implements four different update rules(see [This article](https://doi.org/10.6342/NTU202501601) for details):
- *BiM* (Bisection Method)
- *BiM-S* (a slider variant of BiM)
- *HaB* (Halved Bisection, named as *SimpBisection* in the thesis above)
- *ASA* (Accelerated Stochastic Approximation)

Other algorithms are not implemnted due to their performance. The experiement configuration is the same as described in the thesis above.


## Development and deployment

One-time setup
```bash
npm install -D typescript
npx tsc --init
```

local development
```bash
npx tsc --watch   
npx serve         
```