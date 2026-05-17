

## Plan: Restrict Progression Points to Non-Attribute Spending

### Context
Currently, progression points are tracked but not actually spent. The user clarified that progression points **cannot** be used on attributes — only on skills, advantages/disadvantages, powers, spells, attack rolls, etc.

### Changes

**1. Update point calculation logic (`Index.tsx`)**
- The "Pontos de Progressão" tracker should reflect spending on skills, advantages, and spells beyond the initial 100 CHARACTER_POINTS pool
- Calculate `progressionPointsSpent` as: `max(0, totalSkillsAdvantagesCost - CHARACTER_POINTS)`
- The attribute pool (75 pts) remains completely independent and capped — no overflow into progression

**2. Enforce attribute cap**
- Attribute spending is already capped at 75 points. No changes needed — just ensure progression points never apply to attributes.
- The "Pontos de Atributos" tracker stays as-is with a hard 75 limit.

**3. Allow over-spending CHARACTER_POINTS when progression is available**
- When `totalProgressionPoints > 0`, skills/advantages/spells can exceed the 100-point creation pool
- The combined limit becomes `CHARACTER_POINTS + totalProgressionPoints`
- Update the "Pontos de Perícias/Vantagens" tracker total to `100 + totalProgressionPoints` (or keep them as separate trackers)
- Remove `progressionPointsExtra` state — derive it from actual spending instead

**4. Update PointTracker display**
- When progression exists, the skills/advantages tracker shows the combined budget
- Or: keep two separate trackers (creation 100, progression N) where progression spent = `max(0, totalSpent - 100)`

### Technical Details
- Remove `progressionPointsExtra` state variable (currently unused manual tracking)
- Compute progression spending automatically: `const progressionSpent = Math.max(0, characterPointsSpent - CHARACTER_POINTS)`
- Update the progression PointTracker: `spent={progressionSpent}` / `total={totalProgressionPoints}`
- No changes to AttributePanel — it stays hard-capped at 75

