import React from 'react';
import AIWorkspace from "../components/AIWorkspace";
const feature = {"id":"gap-ai-lunar-night-power","title":"Lunar Night Power Planner","description":"Prepare a professional advisory report for lunar night power planner using the brief and evidence you provide. Review the findings, assumptions, and action plan before applying changes.","samples":[]};
export default function GapLunarNightPower({ token } : { token?: string } = {}) { return <AIWorkspace feature={feature} token={token} />; }
