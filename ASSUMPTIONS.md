# Model assumptions and their evidence

Reviewed 2026-11-26 (v1.6.0). Each default is listed with its value, where it comes from, and how solid it is.
**Strong** = recent peer-reviewed or WHO/World Bank figure. **Reasonable** = defensible proxy or convention. **Weak** = little or no direct evidence; treat as illustrative and replace with local data when possible.
Every value can be changed in the Inputs panel, and each input's source badge repeats the note.

## What is being measured
The annual economic loss from people **not having at least basic sanitation** (a private improved toilet, JMP definition). Every category is measured against that.
Health losses use WHO's country estimates for *inadequate* sanitation, whose reference level is stricter than basic, so they include some benefit of going beyond basic. This is a known, stated limitation.

**Headline total:** health care, days lost to illness, premature deaths, time lost to open defecation, cholera and funerals.
**Shown separately** (can be added to the total in Inputs): stunting, tourism, carbon. See each section for why.

## Data sources
### World Bank (by country, analysis year; one request per country)
| Input | Indicator | Notes |
|---|---|---|
| Population | SP.POP.TOTL | |
| GDP per person | NY.GDP.PCAP.CD | |
| Under-5 mortality | SH.DYN.MORT | |
| Birth rate | SP.DYN.CBRT.IN | Used for the under-5 share of the population |
| Children aged 0-14 | SP.POP.0014.TO.ZS | Minus the under-5 share = children aged 5-14 (valued at a lower rate) |
| Health spending per person | SH.XPD.CHEX.PC.CD | Only used where WHO-CHOICE has no estimate |
| Basic sanitation coverage | SH.STA.BASS.ZS, .UR.ZS, .RU.ZS | National, urban and rural; for the carbon calculation |
| Open defecation | SH.STA.ODFC.ZS, .UR.ZS, .RU.ZS | National, urban and rural. SH.STA.ODEF.ZS no longer exists |
| Urban population | SP.URB.TOTL.IN.ZS | Weights the urban and rural figures |
| Official exchange rate | PA.NUS.FCRF | For the analysis year, so local-currency results are in the same year's prices as the US$ results. Today's market rate (open.er-api.com) is used only if the official rate is missing or is for an older currency unit (more than 10× different; e.g. Zimbabwe, Somalia) |
| Stunting | SH.STA.STNT.ZS | Survey-based, most recent value up to the analysis year |
| Deaths from unsafe WASH | SH.STA.WASH.P5 | Only a fallback now; WHO's sanitation-specific estimates are used where they exist |
| Tourism receipts | ST.INT.RCPT.CD | |
| US GDP per person, US GDP deflator | NY.GDP.PCAP.CD, NY.GDP.DEFL.ZS (USA) | For the VSL transfer and to inflate WHO-CHOICE 2010 costs |

### WHO and WHO-CHOICE (saved in `data/countryEvidence.json` by `scripts/build-evidence.mjs`)
WHO's data service sends no CORS headers, so the browser cannot load it; the figures are saved with the app. Re-run the script to refresh them.
| Data | Source | Notes |
|---|---|---|
| Diarrhoea deaths from inadequate sanitation, total and under 5, with 95% interval | WHO GHO WSH_10_SAN (2019; WHO 2023) | Converted to a rate per person with 2019 World Bank population, then applied to the analysis-year population. 44 of 45 countries (not Tuvalu) |
| Share of diarrhoea attributable to inadequate sanitation, with 95% interval | WHO GHO WSH_20_SAN | Country-specific, e.g. Malawi 44% (32–57%), Niger 45%, Bangladesh 40%. Global 38% |
| Diarrhoea DALYs from inadequate sanitation | WHO GHO WSH_30_SAN | Used to estimate average age at death |
| Reported cholera cases | WHO GHO CHOLERA_0000000001 | Average of the last 10 reported years. WHO's series ends about 2016–2017 |
| Cost per outpatient visit (health centre, no beds) and per bed-day (primary hospital), with 95% interval | WHO-CHOICE, Stenberg et al. (2018), WHO 2021 technical document | 2010 international dollars, converted to 2010 US$ with the World Bank PPP factor ÷ official exchange rate (2010). Extracted from the PDF tables into `scripts/data/who-choice-2010-intl-dollars.json`. No estimate for Somalia, South Sudan or Zimbabwe (health-spending proxy used). Djibouti, Liberia and Myanmar have no usable 2010 price level (missing, mixed currencies, or Myanmar's fixed official rate), so the median of the other countries (0.44) is used |

## Health: diarrhoea
| Assumption | Default | Evidence | Rating |
|---|---|---|---|
| **Share of diarrhoea caused by inadequate sanitation** | **WHO country estimate** (38% global fallback) | WHO 2023 / Wolf et al. 2023, country attributable fractions. Applied to cases, deaths and cholera. Uncertainty range = WHO's 95% interval | Strong |
| **Diarrhoea deaths** | **WHO country estimate** of sanitation deaths ÷ the sanitation share = all diarrhoea deaths | WHO 2023. Fallback: WASH death rate × 0.74 ÷ 0.69, or 9% of under-5 deaths | Strong |
| Under-5 share of the population | 5 × birth rate, less half of under-5 deaths | Demographic identity | Strong |
| Under-5 episodes per child per year | 3.5 (GDP < US$2,000), 1.5, 0.5 | About 3 episodes per child-year in low-income settings (Fischer Walker et al., Lancet 2013). The World Bank prevalence series is archived | Reasonable |
| Over-5 episodes | 15% of the under-5 rate | No direct source | Weak |
| Treatment seeking | 40–95%, rising with GDP | DHS surveys typically show 40–70% for children in low-income countries | Weak |
| **Outpatient case** | **WHO-CHOICE health-centre visit**, inflated with the US GDP deflator, + US$0.50 for ORS and zinc | WHO-CHOICE excludes drugs; the drug cost is approximate. Malawi: US$1.57. Fallback 10% of health spending per person | Reasonable |
| **Hospital admission** | **3 WHO-CHOICE primary-hospital bed-days** + US$3 for fluids and drugs; 10% of treated cases | 3-day stay and drug cost are assumptions. Malawi: US$15.54 | Reasonable |
| Days lost per case | 2 days at 50% of the wage proxy | Sick person or carer. 50% = adult time value in Radin et al. 2020 | Reasonable |

## Deaths
| Assumption | Default | Evidence | Rating |
|---|---|---|---|
| **Valuation in the total** | **Human capital by age at death** | Present value of GDP per person over the rest of the working life (ages 15–64), discounted to the age at death. Replaces "20 years of GDP per person for every death" | Reasonable |
| Age at death, under 5 | 1 year | Most under-5 diarrhoea deaths are in the first two years | Reasonable |
| **Age at death, 5 and over** | **From WHO DALYs per death**: about 92 − DALYs per death (Malawi 46, Niger 37, Bangladesh 57) | WHO's standard life table has life expectancy at birth of about 92. DALYs include some illness, so the age is slightly understated. Where this gives an age under 15 (Afghanistan, Sudan, Yemen: few deaths over 5, so illness dominates), 45 is used. Deaths after 64 lose no working years | Reasonable |
| Discount rate | 5% | Haacker, Hallett & Atun 2020: at least 5% for low- and lower-middle-income countries. Range 3–7% | Strong |
| **Value of statistical life (shown alongside)** | max(20 × GDP per person, 160 × US GDP per person × (GDP ratio)^1.5) | Robinson, Hammitt & O'Keeffe 2019 reference case. For most LDCs the 20× floor applies (Malawi US$12,700 per death), so VSL is only about 1.7× the human capital value. With elasticity 1.0 it would be 160× income | Strong (as a convention) |
| Funeral cost | 20% of GDP per person per death | No direct source | Weak |

## Access time
| Assumption | Default | Evidence | Rating |
|---|---|---|---|
| Who is counted | People aged 5+ who defecate in the open, urban and rural separately | JMP urban and rural rates. Under-5s not counted (Radin et al. 2020) | Strong |
| Extra time per person | 10 minutes/day, urban and rural (editable separately) | WSP sector experts: 2.5 days a year, about 10 minutes a day (Hickling & Hutton 2014). Radin et al. 2020: 8 minutes saved per visit (4–12) | Reasonable |
| **Value of time** | **Adults 15+ 50% of the wage, children 5–14 25%** | Radin et al. 2020 (ranges 25–75% and 0–50%). Was 30% for everyone | Reasonable |
| Wage proxy | GDP per person ÷ 2,080 hours × 0.8 | Proxy | Reasonable |
| Not included | Queueing at shared toilets; safety and dignity, especially for women and girls | No reliable time data; dignity cannot be fairly given a money value | — |

## Cholera and funerals
| Assumption | Default | Evidence | Rating |
|---|---|---|---|
| Cholera cases | Average of the last 10 years reported to WHO | WHO GHO. Misses recent outbreaks (e.g. Malawi 2022–23): enter national figures if available | Reasonable |
| Cost per case | One hospital admission + 4 lost working days at 50% of the wage | Outbreak response (surveillance, vaccination) not included | Weak |
| Sanitation share | Same as diarrhoea | Cholera spreads mainly through water; the share is an approximation | Weak |

## Shown separately: stunting
Not in the total by default: the WASH Benefits (Bangladesh, Kenya) and SHINE (Zimbabwe) trials found household WASH did not improve child growth (Pickering et al. 2019).
| Assumption | Default | Evidence | Rating |
|---|---|---|---|
| Share of stunting caused by unsafe sanitation | 16% | Danaei et al. 2016: 7.2 of 44.1 million cases. An upper bound. Range 0–24% | Weak (upper bound) |
| Future wage penalty | 10% | Hoddinott et al. 2013; Galasso & Wagstaff 2019 (about 7%) | Reasonable |
| Real wage growth | 1.5% a year | Radin et al. 2020 | Reasonable |
| Working life | Ages 15–55 | Convention | Reasonable |

## Shown separately: tourism
| Assumption | Default | Evidence | Rating |
|---|---|---|---|
| Tourism loss | 5% of receipts | No published estimate | Weak |

## Shown separately: carbon
Excluded because (1) basic pit latrines emit as much methane as unimproved ones and open defecation emits little, so reaching basic sanitation does not remove these emissions; (2) the social cost of carbon is worldwide damage; (3) it is priced globally while health losses use local incomes.
| Assumption | Default | Evidence | Rating |
|---|---|---|---|
| Population counted | Everyone without at least basic sanitation (urban and rural) | See point 1 | Weak |
| Emission factor | 35 kg CO2e/person/year (IPCC); SCARE 52 kg | Cheng et al. 2022: 377 Mt CO2e a year (range 22–1,003) | Reasonable |
| Social cost of carbon | US$100/t | Recent central estimates about US$185–190/t (Rennert et al. 2022; US EPA 2023) | Reasonable |

## Benefit-cost: reaching basic sanitation for everyone (v1.7.0; sourced costs since v1.7.1)
Yearly cost = (build cost × (1 + programme delivery)) × capital recovery factor at the discount rate over the toilet's life, + yearly upkeep. Yearly benefit = the headline total. Benefit-cost ratio = benefit ÷ cost. Payback = upfront cost ÷ (benefit − upkeep), undiscounted, flagged when longer than the people-weighted toilet life.

Unit costs come from Hutton & Varughese (2016), *The Costs of Meeting the 2030 Sustainable Development Goal Targets on Drinking Water, Sanitation, and Hygiene*, World Bank WSP: table E.1 (capital cost per person served, US$ 2015, hardware + software, by country), table D.1 (technology mix) and table D.2 (life, maintenance, operating costs). Values for the 45 countries are in `data/sanitationUnitCosts.json`, inflated to the analysis year with the US GDP deflator.

| Assumption | Default | Evidence | Rating |
|---|---|---|---|
| People without at least basic sanitation | World Bank (JMP) urban and rural | SH.STA.BASS.UR.ZS / .RU.ZS | Strong |
| Build cost per person, urban | 50% flush toilet to septic tank + 50% pit latrine (Malawi US$104 in 2023 prices) | Hutton & Varughese 2016, tables D.1 and E.1 | Reasonable |
| Build cost per person, rural | 50% pour-flush pit + 50% dry pit (Malawi US$30) | Hutton & Varughese 2016, tables D.1 and E.1 | Reasonable |
| Who needs a new latrine vs an upgrade | People with an unimproved latrine (pit without slab, hanging or bucket latrine) need only an upgrade; people sharing an improved latrine or defecating in the open need a new one. Malawi 2023: 47% of rural and 23% of urban people without basic need only an upgrade | WHO/UNICEF JMP 2025 country estimates (JMP_2025_WLD.xlsx, washdata.org), in `data/sanitationLadder.json` | Strong |
| Upgrade cost | Concrete latrine platform (SanPlat) US$7.51 per household + 20% programme delivery, ÷ 5 people, inflated from 2015 (about US$2.30 per person in 2023) | Peletz et al. 2017 (rural Tanzania, supply cost; plastic platform US$23.28). Household size is an assumption. A low estimate: some unimproved pits need rebuilding | Weak |
| Programme delivery | 0% extra | Already included: the unit costs include software at 10% (urban) and 20% (rural) of hardware (table D.2). The study says software costs are likely underestimated, especially for the last mile | Reasonable |
| Upkeep | Pits: 5% of capital a year operating + 30% capital maintenance once per 8-year life (8.75% a year). Septic tanks: 30% per 20-year life (1.5% a year), no operating cost given. Weighted by capital (Malawi 6.4%) | Hutton & Varughese 2016, table D.2. Septic-tank emptying is left out | Reasonable |
| Lifespan | Pits 8 years, septic tanks 20; urban = capital-weighted average (Malawi 17 years) | Hutton & Varughese 2016, table D.2 | Reasonable |
| Benefits | All losses in the headline total avoided once everyone is reached | Overstates: health losses are measured against WHO's stricter reference; last-mile households cost more to reach | Reasonable |

Caveats: the study extrapolated unit costs from similar countries where it had no data, so treat them as order-of-magnitude. Some country values are odd: Ethiopia's pour-flush latrine is US$329 per person in 2015 (dry pit US$55), and Eritrea's appears to be extrapolated from it, so their ratios (about 0.3) mostly reflect this; DR Congo and Liberia have high urban septic-tank costs. The headline total is conservative (sanitation only, human capital valuation, stunting excluded), so ratios are lower than in published sanitation studies, which include more benefits and value deaths with VSL.

## Uncertainty
- Each uncertain input has a low and high value (`inputs.ranges`): WHO's and WHO-CHOICE's 95% intervals where the country has them, otherwise the defaults in `constants.ts` (each with its basis).
- **What drives the estimate** (tornado chart): the total with one input at a time at each end of its range.
- **Conservative / upper scenarios**: every input at the end of its range that lowers / raises the total at once. Deliberately extreme.
- **Monte Carlo**: each input drawn from a triangular distribution over its range, independently; 90% range shown.
- Shared links carry any changed inputs as query parameters (e.g. `?access.dailyTimeForODRural=0.25`).

## Comparison with earlier studies
The World Bank Economics of Sanitation Initiative reported larger losses, e.g. about 6.4% of GDP for India (2006) and about 2% for Cambodia, Indonesia, the Philippines and Vietnam combined (Hutton et al. 2008). They attributed 88% of diarrhoea to water, sanitation and hygiene combined (WHO 2004) and also counted water-related costs. This tool counts sanitation only, with WHO's 2019 country estimates, so its results are lower.

## Effect of each review (World Bank data, 2023)
| Country | v1.2.0 | v1.3.0 | v1.4.0 | v1.6.0 |
|---|---|---|---|---|
| Malawi | US$211m (1.58%) | US$125m (0.94%) | US$83m (0.62%) | US$54m (0.40%); range US$42–77m |
| Bangladesh | US$2,637m (0.60%) | US$1,161m (0.27%) | US$995m (0.23%) | US$507m (0.12%) |
| Niger | US$341m (2.01%) | US$466m (2.75%) | US$215m (1.27%) | US$199m (1.17%) |

v1.6.0 changes for Malawi: WHO's country share (44%) replaced the global 38%; WHO-CHOICE unit costs replaced the health-spending proxy (outpatient case US$4 → US$1.57); deaths valued by age; adults' time at 50% (days lost to illness went up); stunting and tourism moved out of the total; the 2023 official exchange rate (1,161 kwacha per US$) replaced today's (about 1,745).

## Sources
- WHO (2023). *Burden of disease attributable to unsafe drinking-water, sanitation and hygiene: 2019 update.* Geneva: WHO. Country data: WHO Global Health Observatory, indicators WSH_10_SAN, WSH_20_SAN, WSH_30_SAN.
- Wolf J. et al. (2023). Burden of disease attributable to unsafe drinking water, sanitation, and hygiene in domestic settings. *Lancet* 401:2060–71.
- WHO Global Health Observatory. Number of reported cases of cholera (CHOLERA_0000000001).
- Stenberg K. et al. (2018). Econometric estimation of WHO-CHOICE country-specific costs for inpatient and outpatient health service delivery. *Cost Effectiveness and Resource Allocation* 16:11. Tables: WHO (2021), *WHO-CHOICE estimates of cost for inpatient and outpatient health service delivery*.
- Robinson L.A., Hammitt J.K., O'Keeffe L. (2019). Valuing mortality risk reductions in global benefit-cost analysis. *Journal of Benefit-Cost Analysis* 10(S1):15–50.
- Radin M., Jeuland M., Wang H., Whittington D. (2020). Benefit–cost analysis of community-led total sanitation: incorporating results from recent evaluations. *Journal of Benefit-Cost Analysis* 11(3):380–417.
- Hickling S., Hutton G. (2014). *Economic assessment of sanitation interventions.* Water and Sanitation Program, World Bank (as cited by Radin et al. 2020).
- Hutton G. et al. (2008). *Economic impacts of sanitation in Southeast Asia.* Water and Sanitation Program, World Bank.
- WHO/UNICEF Joint Monitoring Programme (2025). Household drinking water, sanitation and hygiene estimates, world file JMP_2025_WLD.xlsx. https://washdata.org/data/household
- Peletz R. et al. (2017). Supply and demand for improved sanitation: results from randomized pricing experiments in rural Tanzania. *Environmental Science & Technology*.
- Hutton G., Varughese M. (2016). *The Costs of Meeting the 2030 Sustainable Development Goal Targets on Drinking Water, Sanitation, and Hygiene.* Water and Sanitation Program technical paper, World Bank. Copy used: https://www.fsmtoolbox.com/assets/pdf/The_costs_of_Meeting_the_2030_SDG_in_WASH.pdf
- Danaei G. et al. (2016). Risk factors for childhood stunting in 137 developing countries. *PLOS Medicine* 13(11):e1002164.
- Pickering A.J. et al. (2019). The WASH Benefits and SHINE trials: interpretation of WASH intervention effects on linear growth and diarrhoea. *Lancet Global Health* 7:e1139–46.
- Haacker M., Hallett T.B., Atun R. (2020). On discount rates for economic evaluations in global health. *Health Policy and Planning*.
- Hoddinott J. et al. (2013). Adult consequences of growth failure in early childhood. *American Journal of Clinical Nutrition*.
- Galasso E., Wagstaff A. (2019). The aggregate income losses from childhood stunting and the returns to a nutrition intervention aimed at reducing stunting. *Economics & Human Biology*.
- Cheng S. et al. (2022). Non-negligible greenhouse gas emissions from non-sewered sanitation systems: a meta-analysis. *Environmental Research* 212:113468.
- Rennert K. et al. (2022). Comprehensive evidence implies a higher social cost of CO2. *Nature*.
- Fischer Walker C.L. et al. (2013). Global burden of childhood pneumonia and diarrhoea. *Lancet*.
