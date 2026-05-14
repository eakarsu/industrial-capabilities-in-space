require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/ai', require('./routes/ai_extras'));
app.use('/api/bases', require('./routes/bases'));
app.use('/api/mining', require('./routes/mining'));
app.use('/api/resources', require('./routes/resources'));
app.use('/api/print_jobs', require('./routes/print_jobs'));
app.use('/api/equipment', require('./routes/equipment'));
app.use('/api/missions', require('./routes/missions'));
app.use('/api/util', require('./routes/utilities'));
app.use('/api/admin', require('./routes/sample_data'));
app.use('/api/dashboard', require('./routes/dashboard'));

const PORT = process.env.PORT || 3010;
app.listen(PORT, () => console.log(`LunarBase API running on port ${PORT}`));
app.use('/api/gap-ai-regolith-process-optimizer', require('./routes/gap-ai-regolith-process-optimizer'));
app.use('/api/gap-ai-lunar-night-power', require('./routes/gap-ai-lunar-night-power'));
app.use('/api/gap-ai-orbital-mechanics-routing', require('./routes/gap-ai-orbital-mechanics-routing'));
app.use('/api/gap-ai-print-quality-predictor', require('./routes/gap-ai-print-quality-predictor'));
app.use('/api/gap-ai-crew-task-sequencer', require('./routes/gap-ai-crew-task-sequencer'));
app.use('/api/gap-nonai-simulation-twin', require('./routes/gap-nonai-simulation-twin'));
app.use('/api/gap-nonai-comms-latency-queue', require('./routes/gap-nonai-comms-latency-queue'));
app.use('/api/gap-nonai-mission-video-stream', require('./routes/gap-nonai-mission-video-stream'));
app.use('/api/gap-nonai-isru-yield', require('./routes/gap-nonai-isru-yield'));
app.use('/api/gap-nonai-print-cad-upload', require('./routes/gap-nonai-print-cad-upload'));
app.use('/api/cf-regolith-electrolysis', require('./routes/cf-regolith-electrolysis'));
app.use('/api/cf-lunar-hibernation', require('./routes/cf-lunar-hibernation'));
app.use('/api/cf-lunar-marketplace', require('./routes/cf-lunar-marketplace'));
app.use('/api/cf-teleop-eva-agent', require('./routes/cf-teleop-eva-agent'));
app.use('/api/cf-isru-cert-pipeline', require('./routes/cf-isru-cert-pipeline'));
