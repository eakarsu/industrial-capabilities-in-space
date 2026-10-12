import React from 'react';
import AIWorkspace from "../components/AIWorkspace";
const feature = {"id":"cf-regolith-electrolysis","title":"Regolith Electrolysis Tuner","description":"Prepare a professional advisory report for regolith electrolysis tuner using the brief and evidence you provide. Review the findings, assumptions, and action plan before applying changes.","samples":[]};
export default function CfRegolithElectrolysis({ token } : { token?: string } = {}) { return <AIWorkspace feature={feature} token={token} />; }
