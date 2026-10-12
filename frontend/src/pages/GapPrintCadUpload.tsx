import React from 'react';
import AIWorkspace from "../components/AIWorkspace";
const feature = {"id":"gap-nonai-print-cad-upload","title":"Print CAD Upload","description":"Prepare a professional advisory report for print cad upload using the brief and evidence you provide. Review the findings, assumptions, and action plan before applying changes.","samples":[]};
export default function GapPrintCadUpload({ token } : { token?: string } = {}) { return <AIWorkspace feature={feature} token={token} />; }
