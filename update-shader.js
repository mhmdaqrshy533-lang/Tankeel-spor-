const fs = require('fs');

const session = JSON.parse(fs.readFileSync('./sessions/shader-session-1.json', 'utf8'));

session.description = "Milky Way-X Starfield & Mercury-X";
session.shaderCode = "vec3 ro=u_cameraPosition;vec2 uv=(FC.xy*2.-r.xy)/r.y;float roll=u_cameraRoll;mat2 rM=mat2(cos(roll),-sin(roll),sin(roll),cos(roll));uv=rM*uv;vec3 rd=normalize(vec3(uv,slider_fov));rd=rotate3D(u_cameraRotation.y,vec3(0,1,0))*rd;vec3 cR=normalize(cross(vec3(0,1,0),rd));rd=rotate3D(slider_cameraPitch+u_cameraRotation.x,cR)*rd;vec3 col=vec3(0.);vec3 rd_bg=rd;float rx=atan(rd_bg.z,rd_bg.x);float ry=asin(rd_bg.y);float starVal=fract(sin(dot(floor(rd_bg.xy*800.),vec2(12.9898,78.233)))*43758.5453);if(starVal>.99){float twinkle=sin(t*5.+starVal*100.)*.5+.5;col+=vec3(.88,.97,1.)*twinkle*2.;}float starVal2=fract(sin(dot(floor(rd_bg.yz*600.),vec2(23.123,54.342)))*43758.5453);if(starVal2>.995){float twinkle=sin(t*3.+starVal2*50.)*.5+.5;col+=vec3(0.,.9,1.)*twinkle*2.5;}float starVal3=fract(sin(dot(floor(rd_bg.zx*500.),vec2(99.99,11.11)))*43758.5453);if(starVal3>.992){float twinkle=sin(t*4.+starVal3*70.)*.5+.5;col+=vec3(1.,.84,0.)*twinkle*2.;}float starVal4=fract(sin(dot(floor(rd_bg.zx*700.),vec2(5.55,3.33)))*43758.5453);if(starVal4>.995){float twinkle=sin(t*2.+starVal4*20.)*.5+.5;col+=vec3(.61,.15,.69)*twinkle*2.5;}vec3 pCenter=vec3(0.,0.,400.);vec3 toPlanet=pCenter-ro;vec3 pDir=normalize(toPlanet);float b=dot(rd,-toPlanet);float c=dot(toPlanet,toPlanet)-120.*120.;float m=b*b-c;float dHit=1e6;if(m>0.){float dPlanet=-b-sqrt(m);if(dPlanet>0.){dHit=dPlanet;vec3 pHit=ro+rd*dPlanet;vec3 n=normalize(pHit-pCenter);vec3 sunDir=normalize(vec3(-.5,.2,-1.));float diff=max(dot(n,sunDir),0.);col=vec3(.2,.22,.25)*diff+vec3(.02);float crater=sin(n.x*20.)*cos(n.y*20.)*sin(n.z*20.);col-=crater*.05*diff;}}float fC=fract(t*slider_laserSpeed);if(fC<slider_laserPulse){vec3 lD=rotate3D(u_cameraRotation.y,vec3(0,1,0))*rotate3D(slider_cameraPitch+u_cameraRotation.x,cR)*vec3(0.,0.,1.);vec3 l1=ro+rotate3D(u_cameraRotation.y,vec3(0,1,0))*rotate3D(slider_cameraPitch+u_cameraRotation.x,cR)*vec3(-2.,-.2,0.)+lD*(5.+fC*300.);vec3 l2=ro+rotate3D(u_cameraRotation.y,vec3(0,1,0))*rotate3D(slider_cameraPitch+u_cameraRotation.x,cR)*vec3(2.,-.2,0.)+lD*(5.+fC*300.);float t1=dot(l1-ro,rd);float t2=dot(l2-ro,rd);if(t1>0.&&t1<dHit){float o1=length((l1-ro)-rd*t1);col+=vec3(1.,0.,.2)*(.08/(.001+o1*o1))*(1.-fC/slider_laserPulse);}if(t2>0.&&t2<dHit){float o2=length((l2-ro)-rd*t2);col+=vec3(1.,0.,.2)*(.08/(.001+o2*o2))*(1.-fC/slider_laserPulse);}}o.rgb=col;";

// Change B-2 Stealth setup in shipConfig
session.shipConfig.complexity = 10;
session.shipConfig.fold1 = 0.5;
session.shipConfig.fold2 = 1.0;
session.shipConfig.scale = 1.5;
session.shipConfig.stretch = 2.0; // wider wings
session.shipConfig.taper = 0.05;
session.shipConfig.twist = 0;

fs.writeFileSync('./sessions/shader-session-1.json', JSON.stringify(session, null, 2));
