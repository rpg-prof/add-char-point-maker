import {
  attributeNames,
  clampAttributeValue,
  getAttributeLimits,
  type AttributeName,
} from "@/data/characterData";
import { subAttributeMap } from "@/data/subAttributes";
import type { SubAttributes } from "@/components/AttributePanel";

function clampSubValue(
  race: string,
  attr: AttributeName,
  mainVal: number,
  value: number
): number {
  const { min, max } = getAttributeLimits(race, attr);
  return Math.max(min, Math.min(max, Math.max(mainVal - 2, Math.min(mainVal + 2, value))));
}

function syncSubAttributesForMain(
  race: string,
  attr: AttributeName,
  mainVal: number,
  subAttributes: SubAttributes
): SubAttributes {
  const def = subAttributeMap.find((d) => d.main === attr);
  if (!def) return subAttributes;

  const next = { ...subAttributes };
  let sub1 = clampSubValue(race, attr, mainVal, next[def.sub1] ?? mainVal);
  let sub2 = clampSubValue(race, attr, mainVal, next[def.sub2] ?? mainVal);
  const targetSum = mainVal * 2;

  if (sub1 + sub2 !== targetSum) {
    sub2 = targetSum - sub1;
    sub2 = clampSubValue(race, attr, mainVal, sub2);
    sub1 = targetSum - sub2;
    sub1 = clampSubValue(race, attr, mainVal, sub1);
    sub2 = targetSum - sub1;
    sub2 = clampSubValue(race, attr, mainVal, sub2);
  }

  next[def.sub1] = sub1;
  next[def.sub2] = sub2;
  return next;
}

export function clampAttributesForRace(
  attributes: Record<AttributeName, number>,
  subAttributes: SubAttributes,
  race: string
): { attributes: Record<AttributeName, number>; subAttributes: SubAttributes } {
  let nextAttrs = { ...attributes };
  let nextSubs = { ...subAttributes };

  for (const attr of attributeNames) {
    nextAttrs[attr] = clampAttributeValue(race, attr, nextAttrs[attr]);
    nextSubs = syncSubAttributesForMain(race, attr, nextAttrs[attr], nextSubs);
  }

  return { attributes: nextAttrs, subAttributes: nextSubs };
}
