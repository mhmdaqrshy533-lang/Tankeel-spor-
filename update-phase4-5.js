const fs = require('fs');

const session = JSON.parse(fs.readFileSync('./sessions/shader-session-1.json', 'utf8'));

if (!session.uniforms.slider_landing) {
    session.uniforms.slider_landing = 0.0;
    session.sliders.push({
        "name": "Landing",
        "description": "Transition to landing.",
        "variableName": "slider_landing",
        "min": 0.0,
        "max": 1.0,
        "step": 0.01,
        "defaultValue": 0.0
    });
}

let code = `
vec3 ro=u_cameraPosition;
vec2 uv=(FC.xy*2.-r.xy)/r.y;
float roll=u_cameraRoll;
mat2 rM=mat2(cos(roll),-sin(roll),sin(roll),cos(roll));
uv=rM*uv;
vec3 rd=normalize(vec3(uv,slider_fov));
rd=rotate3D(u_cameraRotation.y,vec3(0,1,0))*rd;
vec3 cR=normalize(cross(vec3(0,1,0),rd));
rd=rotate3D(slider_cameraPitch+u_cameraRotation.x,cR)*rd;

rd=rotate3D(slider_landing*0.5, cR)*rd;

vec3 col=vec3(0.);vec3 rd_bg=rd;
float star1=fract(sin(dot(floor(rd_bg.xy*800.),vec2(12.9898,78.233)))*43758.5453);if(star1>.99){float tnk=sin(t*5.+star1*100.)*.5+.5;col+=vec3(.88,.97,1.)*tnk*2.*(1.-slider_landing);}
float star2=fract(sin(dot(floor(rd_bg.yz*600.),vec2(23.123,54.342)))*43758.5453);if(star2>.995){float tnk=sin(t*3.+star2*50.)*.5+.5;col+=vec3(0.,.9,1.)*tnk*2.5*(1.-slider_landing);}
float star3=fract(sin(dot(floor(rd_bg.zx*500.),vec2(99.99,11.11)))*43758.5453);if(star3>.992){float tnk=sin(t*4.+star3*70.)*.5+.5;col+=vec3(1.,.84,0.)*tnk*2.*(1.-slider_landing);}
float star4=fract(sin(dot(floor(rd_bg.zx*700.),vec2(5.55,3.33)))*43758.5453);if(star4>.995){float tnk=sin(t*2.+star4*20.)*.5+.5;col+=vec3(.61,.15,.69)*tnk*3.*(1.-slider_landing);}

vec3 pC=vec3(0.,mix(0., -100., slider_landing), mix(400., 150., slider_landing));
vec3 toP=pC-ro;
float b=dot(rd,-toP);
float c=dot(toP,toP)-120.*120.;
float m=b*b-c;
float dHit=1e6;
if(m>0.){
    float dP=-b-sqrt(m);
    if(dP>0.){
        dHit=dP;
        vec3 n=normalize(ro+rd*dP-pC);
        vec3 sD=normalize(vec3(-.5,.2,-1.));
        col=mix(col, vec3(.2,.22,.25)*max(dot(n,sD),0.)+vec3(.02), 1.0 - slider_landing);
        col-=sin(n.x*20.)*cos(n.y*20.)*sin(n.z*20.)*.05*max(dot(n,sD),0.);
    }
}

if (slider_landing > 0.01) {
    vec3 cp = ro + vec3(0., mix(50., 15., slider_landing), t*10.); 
    float tDist = 0.0;
    for(int i=0; i<60; i++) {
        vec3 p = cp + rd*tDist;
        float h = sin(p.x*.1)*cos(p.z*.1)*10. + sin(p.x*.05)*5.; 
        float d = p.y - h;
        if(d < 0.1) {
            vec3 n = normalize(vec3(
                cos(p.x*.1)*1.*cos(p.z*.1) + cos(p.x*.05)*.25,
                1.0,
                -sin(p.x*.1)*sin(p.z*.1)*1.0
            ));
            float diff = max(dot(n, normalize(vec3(0.5,1.0,0.5))), 0.2);
            vec3 tCol = vec3(0.5, 0.25, 0.15) * diff;
            float fog = exp(-tDist*0.01);
            col = mix(col, mix(vec3(.8,.4,.2), tCol, fog), slider_landing);
            dHit = min(dHit, tDist);
            break;
        }
        tDist += d*0.5;
        if(tDist > 200.) break;
    }
}

float fC=fract(t*slider_laserSpeed);
if(fC<slider_laserPulse){
    vec3 lD=rotate3D(u_cameraRotation.y,vec3(0,1,0))*rotate3D(slider_cameraPitch+u_cameraRotation.x,cR)*vec3(0.,0.,1.);
    vec3 l1=ro+rotate3D(u_cameraRotation.y,vec3(0,1,0))*rotate3D(slider_cameraPitch+u_cameraRotation.x,cR)*vec3(-2.,-.2,0.)+lD*(5.+fC*300.);
    vec3 l2=ro+rotate3D(u_cameraRotation.y,vec3(0,1,0))*rotate3D(slider_cameraPitch+u_cameraRotation.x,cR)*vec3(2.,-.2,0.)+lD*(5.+fC*300.);
    float t1=dot(l1-ro,rd);
    float t2=dot(l2-ro,rd);
    if(t1>0.&&t1<dHit){float o1=length((l1-ro)-rd*t1);col+=vec3(1.,0.,.2)*(.08/(.001+o1*o1))*(1.-fC/slider_laserPulse);}
    if(t2>0.&&t2<dHit){float o2=length((l2-ro)-rd*t2);col+=vec3(1.,0.,.2)*(.08/(.001+o2*o2))*(1.-fC/slider_laserPulse);}
}
o.rgb=col;
`;

session.shaderCode = code.replace(/\n/g, '');
fs.writeFileSync('./sessions/shader-session-1.json', JSON.stringify(session, null, 2));

console.log('done');
