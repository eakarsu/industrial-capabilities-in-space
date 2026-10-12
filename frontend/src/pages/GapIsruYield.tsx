import React from 'react';
import AIWorkspace from "../components/AIWorkspace";
const feature = {"id":"gap-nonai-isru-yield","title":"ISRU Yield Tracking","description":"Prepare a professional advisory report for isru yield tracking using the brief and evidence you provide. Review the findings, assumptions, and action plan before applying changes.","samples":[]};
export default function GapIsruYield({ token } : { token?: string } = {}) { return <AIWorkspace feature={feature} token={token} />; }
