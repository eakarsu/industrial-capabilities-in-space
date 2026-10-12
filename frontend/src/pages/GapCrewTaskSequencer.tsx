import React from 'react';
import AIWorkspace from "../components/AIWorkspace";
const feature = {"id":"gap-ai-crew-task-sequencer","title":"Crew Task Sequencer","description":"Prepare a professional advisory report for crew task sequencer using the brief and evidence you provide. Review the findings, assumptions, and action plan before applying changes.","samples":[]};
export default function GapCrewTaskSequencer({ token } : { token?: string } = {}) { return <AIWorkspace feature={feature} token={token} />; }
