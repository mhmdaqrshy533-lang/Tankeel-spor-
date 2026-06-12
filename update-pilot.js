const fs = require('fs');

const session = JSON.parse(fs.readFileSync('./sessions/shader-session-1.json', 'utf8'));

if (!session.uniforms.slider_pilot) {
    session.uniforms.slider_pilot = 0.0;
    session.sliders.push({
        "name": "Pilot Out",
        "description": "Pilot exiting.",
        "variableName": "slider_pilot",
        "min": 0.0,
        "max": 1.0,
        "step": 0.01,
        "defaultValue": 0.0
    });
}
fs.writeFileSync('./sessions/shader-session-1.json', JSON.stringify(session, null, 2));

console.log('done');
