const assert=require('node:assert/strict');
const motion=[
  {intro:.16,accel:.48,decel:2.05,settle:.48,distance:28,landing:7.5,overshoot:.082,ripple:.11},
  {intro:.28,accel:.72,decel:2.65,settle:.55,distance:34,landing:9,overshoot:.065,ripple:.08},
  {intro:.06,accel:.56,decel:2.25,settle:.46,distance:31,landing:8,overshoot:.09,ripple:.13},
  {intro:.39,accel:.63,decel:2.40,settle:.50,distance:35,landing:9.5,overshoot:.075,ripple:.09},
  {intro:.12,accel:.84,decel:3.15,settle:.62,distance:38,landing:10,overshoot:.095,ripple:.12},
  {intro:.22,accel:.52,decel:2.35,settle:.54,distance:32,landing:8.5,overshoot:.068,ripple:.10},
];
const smooth=x=>{x=Math.min(1,Math.max(0,x));return x*x*(3-2*x);};
function position(t,m){
  const {intro,accel,decel,settle,distance,landing,overshoot,ripple}=m;
  const cruise=landing-intro-accel-decel-settle;
  const speed=(distance+overshoot)/(.5*accel+cruise+decel/4);
  t-=intro;if(t<=0)return 0;
  if(t<accel)return speed*(t/2-accel*Math.sin(Math.PI*t/accel)/(2*Math.PI));
  t-=accel;const a=speed*accel/2;
  // Individual, gentle speed variation returns to zero at either end of cruise.
  if(t<cruise){const u=t/cruise;return a+speed*t+ripple*Math.sin(Math.PI*u)**2*Math.sin(6*Math.PI*u);}
  t-=cruise;
  if(t<decel)return a+speed*cruise+speed*decel/4*(1-(1-t/decel)**4);
  t-=decel;
  const knots=[[0,overshoot],[settle*.26,-overshoot*.34],[settle*.54,overshoot*.12],[settle*.79,-overshoot*.025],[settle,0]];
  for(let k=1;k<knots.length;k++)if(t<knots[k][0]){const[ta,ya]=knots[k-1],[tb,yb]=knots[k];return distance+ya+(yb-ya)*smooth((t-ta)/(tb-ta));}
  return distance;
}
// Check real independent trajectories and exact final positions before rendering.
for(const m of motion){
  assert(m.landing-m.intro-m.accel-m.decel-m.settle>0);
  assert(Math.abs(position(m.landing,m)-m.distance)<1e-9);
  assert.equal(position(15,m),m.distance);
}
assert.equal(new Set(motion.map(m=>position(3,m).toFixed(3))).size,6);
assert.equal(new Set(motion.map(m=>m.landing)).size,6);
assert.equal(Math.max(...motion.map(m=>m.landing)),10);
module.exports={motion,position};
