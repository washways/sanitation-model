# Model assumptions and their evidence

Reviewed 2026-11-25 (v1.3.0). Each default is listed with its value, where it comes from, and how solid it is.
**Strong** = recent peer-reviewed or WHO/World Bank figure. **Reasonable** = defensible proxy or convention. **Weak** = little or no direct evidence; treat as illustrative and replace with local data when possible.
Every value can be changed in the Inputs panel, and each input's source badge repeats the note.

## Data from the World Bank (by country, analysis year)
| Input | Indicator | Notes |
|---|---|---|
| Population | SP.POP.TOTL | |
| GDP per person | NY.GDP.PCAP.CD | |
| Under-5 mortality | SH.DYN.MORT | |
| Birth rate | SP.DYN.CBRT.IN | Used for the under-5 share of the population |
| Health spending per person | SH.XPD.CHEX.PC.CD | Used for unit treatment costs |
| Basic sanitation coverage | SH.STA.BASS.ZS | Used for the carbon calculation |
| Open defecation | SH.STA.ODFC.ZS | Before v1.3.0 the app used a code that no longer exists (SH.STA.ODEF.ZS), so every country silently got 5% |
| Stunting | SH.STA.STNT.ZS | Survey-based, most recent value up to the analysis year |
| Deaths from unsafe WASH | SH.STA.WASH.P5 (SDG 3.9.2) | WHO modelled estimate, 2019 only |
| Tourism receipts | ST.INT.RCPT.CD | |

The World Bank diarrhoea prevalence series (SH.STA.DIAR.ZS / SH.STA.DIRH.ZS) has been archived and can no longer be fetched, so incidence uses the income-based default below.

## Health: diarrhoea
| Assumption | Default | Evidence | Rating |
|---|---|---|---|
| **Share of diarrhoea caused by unsafe sanitation** | **38%** | WHO (2023) 2019 update and Wolf et al. (Lancet 2023): 564,000 diarrhoea deaths from unsafe sanitation out of about 1.5 million diarrhoea deaths (1,035,000 WASH-attributable deaths = 69% of the total). Global average; likely higher where coverage is low. | Strong |
| *Replaced:* 88% when WASH data were missing | — | WHO (2004) figure for water, sanitation **and** hygiene combined; out of date and not sanitation alone. | — |
| *Replaced:* 100% when WASH data were present | — | Wrong. The WHO WASH death rate covers water + sanitation + hygiene and four diseases, not sanitation alone. Worse, the 100% was also applied to all diarrhoea **cases**, so every case of diarrhoea was counted as caused by poor sanitation. | — |
| All diarrhoea deaths | WASH deaths × 0.74 ÷ 0.69 | WHO 2023: diarrhoea is 1,035,000 of 1.4 million WASH deaths (74%), and WASH causes 69% of diarrhoea deaths. | Strong |
| Under-5 share of diarrhoea deaths | 26% | WHO 2023: 273,000 of 1,035,000. Global; higher in sub-Saharan Africa. Was 70%. Does not change the cost (all deaths are valued the same way). | Reasonable |
| Fallback when WASH deaths are missing | 9% of under-5 deaths are diarrhoea | UNICEF/WHO child cause-of-death estimates (about 9%). | Reasonable |
| Under-5 share of population | 5 × birth rate, less half of under-5 deaths | Demographic identity. Was a fixed 15%, which overstated it for Asian countries (Bangladesh is about 10%). | Strong |
| Under-5 episodes per child per year | 3.5 (GDP < US$2,000), 1.5, 0.5 | In line with about 3 episodes per child-year in low-income settings (Fischer Walker et al., Lancet 2013). | Reasonable |
| Over-5 episodes | 15% of the under-5 rate | No direct source; plausible against GBD all-age rates. | Weak |
| Treatment seeking | 40–95%, rising with GDP | Rough proxy; DHS surveys typically show 40–70% for children in low-income countries. | Weak |
| Outpatient cost | 10% of health spending per person | Proxy; gives about US$3–5, similar to WHO-CHOICE primary-care visit costs for low-income countries. | Weak |
| Inpatient cost / share admitted | 8 × outpatient; 10% admitted | Approximates a 3–4 day stay. | Weak |
| Days lost per case | 2 days at 50% of the wage proxy | WSP Economic Impacts of Sanitation convention (covers carer time for children). | Reasonable |

## Deaths
| Assumption | Default | Evidence | Rating |
|---|---|---|---|
| Valuation method | Human capital: 20 years of GDP per person, discounted | Conservative convention. Does not depend on age at death. | Reasonable |
| **Discount rate** | **5%** (was 10%) | Haacker, Hallett & Atun (Health Policy and Planning, 2020): at least 5% for low- and lower-middle-income countries. The iDSI reference case uses 3%. 10% had no source and roughly halved long-term costs. | Strong |
| Value of statistical life | 70 × GDP per person (optional method) | Robinson, Hammitt & O'Keeffe (2019) give a wide range for low-income countries, often well below 70×. | Weak |
| Funeral cost | 20% of GDP per person per death | No direct source. | Weak |

## Stunting
| Assumption | Default | Evidence | Rating |
|---|---|---|---|
| **Share of stunting caused by unsafe sanitation** | **16%** (was 50%) | Danaei et al. (PLOS Medicine 2016): 7.2 of 44.1 million stunting cases attributable to unimproved sanitation. An upper bound: the WASH Benefits (Bangladesh, Kenya) and SHINE (Zimbabwe) trials found household WASH did not improve growth (Pickering et al., Lancet Global Health 2019). The 50% came from an old, loosely sourced WHO statement covering all of WASH. | Strong (as upper bound) |
| Future wage penalty | 10% | Hoddinott et al. (2013): 1 SD more height-for-age goes with 21% higher household spending. Galasso & Wagstaff (2019): about 7% population-wide income penalty. | Reasonable |
| Working life | Ages 15–55, wage proxy | Convention. | Reasonable |

## Access time
| Assumption | Default | Evidence | Rating |
|---|---|---|---|
| **Extra time per person in open defecation** | **10 minutes/day** (was 30, i.e. 0.5 hours) | Compared with a latrine at home. WSP sector experts: 2.5 days a year, about 10 minutes a day (Hickling & Hutton 2014). Radin et al. (2020) use 8 minutes saved per latrine visit (range 4–12), citing about 7 minutes a day per adult in rural India (Dickinson et al. 2015) and 6 minutes vs 2 minutes per trip in Ethiopia. The old 30 minutes had no source and was three times these figures. | Reasonable |
| Who is counted | People aged 5 and over in open defecation | Radin et al. (2020) give under-5s' time no value. Before v1.4.0 everyone was counted. | Reasonable |
| Value of that time | 30% of the wage proxy | Common convention in WASH cost-benefit studies (Hutton). Radin et al. (2020) use 50% for adults and 25% for school-age children. | Reasonable |
| Wage proxy | GDP per person ÷ 2,080 hours × 0.8 | Proxy. | Reasonable |

## Carbon (shown separately, not in the total since v1.3.1)
Excluded from the total by default (can be switched on under Inputs → Carbon), because:
1. Basic pit latrines emit as much methane as unimproved ones, and open defecation emits little, so moving people to basic sanitation does not remove these emissions. Only treatment, safe emptying or container-based systems do. It is not a cost of *poor* sanitation.
2. The social cost of carbon is damage to the whole world; the country bears a tiny share of it. Mixing it into a national economic burden is inconsistent.
3. It is valued at a global price (US$100/t) while health losses are valued at local incomes, so it dominates in low-income countries. For Malawi it was the largest single item (US$38m of US$125m).

| Assumption | Default | Evidence | Rating |
|---|---|---|---|
| Population counted | Everyone without basic sanitation | See point 1 above. | Weak |
| Emission factor | 35 kg CO2e/person/year (IPCC); SCARE 52 kg | Cheng et al. (Environmental Research 2022): non-sewered sanitation emits 377 Mt CO2e a year (range 22–1,003). Very uncertain. | Reasonable |
| Social cost of carbon | US$100/t | Conservative; recent central estimates are about US$185–190/t (Rennert et al., Nature 2022; US EPA 2023). | Reasonable |

## Other
| Assumption | Default | Evidence | Rating |
|---|---|---|---|
| Cholera response | 0.01% of GDP every year (was 2,000 × GDP per person) | No source. Placeholder; replace with the national cholera response plan budget or set to 0. The old rule did not scale with population, so it was 21% of GDP for Tuvalu and the largest item for Kiribati. | Weak |
| Tourism loss | 5% of tourism receipts | No published estimate found. | Weak |

## Effect of the v1.3.0 review (World Bank data, 2023)
| Country | Before | After |
|---|---|---|
| Malawi | US$211m (1.58% of GDP) | US$125m (0.94%) |
| Bangladesh | US$2,637m (0.60%) | US$1,161m (0.27%) |
| Niger | US$341m (2.01%) | US$466m (2.75%; real open-defecation rate of 67% instead of 5%) |

With carbon taken out of the total (v1.3.1): Malawi US$88m (0.65%), Bangladesh US$957m (0.22%), Niger US$389m (2.30%).

With 10 minutes of open-defecation time for people aged 5+ and the cholera placeholder scaled to GDP (v1.4.0): Malawi US$83m (0.62%), Bangladesh US$995m (0.23%), Niger US$215m (1.27%).

## Sources
- WHO (2023). *Burden of disease attributable to unsafe drinking-water, sanitation and hygiene: 2019 update.* Geneva: WHO.
- Wolf J. et al. (2023). Burden of disease attributable to unsafe drinking water, sanitation, and hygiene in domestic settings. *Lancet* 401:2060–71.
- Danaei G. et al. (2016). Risk factors for childhood stunting in 137 developing countries. *PLOS Medicine* 13(11):e1002164.
- Pickering A.J. et al. (2019). The WASH Benefits and SHINE trials: interpretation of WASH intervention effects on linear growth and diarrhoea. *Lancet Global Health* 7:e1139–46.
- Haacker M., Hallett T.B., Atun R. (2020). On discount rates for economic evaluations in global health. *Health Policy and Planning*.
- Robinson L.A., Hammitt J.K., O'Keeffe L. (2019). Valuing mortality risk reductions in global benefit-cost analysis. *Journal of Benefit-Cost Analysis* 10(S1):15–50.
- Hoddinott J. et al. (2013). Adult consequences of growth failure in early childhood. *American Journal of Clinical Nutrition*.
- Galasso E., Wagstaff A. (2019). The aggregate income losses from childhood stunting and the returns to a nutrition intervention aimed at reducing stunting. *Economics & Human Biology* (World Bank WPS8536).
- Cheng S. et al. (2022). Non-negligible greenhouse gas emissions from non-sewered sanitation systems: a meta-analysis. *Environmental Research* 212:113468.
- Rennert K. et al. (2022). Comprehensive evidence implies a higher social cost of CO2. *Nature*.
- Radin M., Jeuland M., Wang H., Whittington D. (2020). Benefit–cost analysis of community-led total sanitation: incorporating results from recent evaluations. *Journal of Benefit-Cost Analysis* 11(3):380–417.
- Hickling S., Hutton G. (2014). *Economic assessment of sanitation interventions.* Water and Sanitation Program, World Bank (as cited by Radin et al. 2020).
- Fischer Walker C.L. et al. (2013). Global burden of childhood pneumonia and diarrhoea. *Lancet*.
