import React from 'react';
import AIWorkspace from "../components/AIWorkspace";
const feature = {"id":"cf-lunar-marketplace","title":"Lunar Supply Chain Marketplace","description":"Prepare a professional advisory report for lunar supply chain marketplace using the brief and evidence you provide. Review the findings, assumptions, and action plan before applying changes.","samples":[]};
export default function CfLunarMarketplace({ token } : { token?: string } = {}) { return <AIWorkspace feature={feature} token={token} />; }
