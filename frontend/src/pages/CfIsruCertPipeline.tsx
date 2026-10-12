import React from 'react';
import AIWorkspace from "../components/AIWorkspace";
const feature = {"id":"cf-isru-cert-pipeline","title":"ISRU Certification Pipeline","description":"Prepare a professional advisory report for isru certification pipeline using the brief and evidence you provide. Review the findings, assumptions, and action plan before applying changes.","samples":[]};
export default function CfIsruCertPipeline({ token } : { token?: string } = {}) { return <AIWorkspace feature={feature} token={token} />; }
