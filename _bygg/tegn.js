(function(){
var d=document,r=d.documentElement,TRINN=56,
 B=[].slice.call(d.querySelectorAll('.skinnefelt>*')),
 P=[].slice.call(d.querySelectorAll('.skinnefelt .tilkobling,.jord'));
if(!r.classList.contains('tegn')||!B.length)return;
var b=[],p=[],slutt=0,fra=0,bredde=innerWidth,ko=0,t0=0,
 forsinkelse=d.querySelector('.fjell')?1400:0,INTRO=900,ferdig=false;
function mal(){
 var y=scrollY;
 b=B.map(function(e,i){var q=e.getBoundingClientRect();return{e:e,top:q.top+y,h:q.height,t:b[i]?b[i].t:null}});
 p=P.map(function(e,i){var q=e.getBoundingClientRect();return{e:e,y:q.top+q.height/2+y,paa:p[i]?p[i].paa:null}});
 fra=b[0].top;slutt=b[b.length-1].top+b[b.length-1].h;
 tegn();
}
function tegn(){
 ko=0;
 var vh=innerHeight,maks=Math.max(r.scrollHeight-vh,0),s=Math.min(Math.max(scrollY,0),maks),
  mal0=.72*vh,malS=slutt+TRINN-maks,a=Math.min(Math.max((s-(maks-vh))/vh,0),1),
  spiss=s+mal0+(malS-mal0)*a;
 if(!ferdig){
  var k=Math.min(Math.max((performance.now()-t0-forsinkelse)/INTRO,0),1);
  if(k>=1)ferdig=true;else planlegg();
  spiss=fra+(spiss-fra)*(1-Math.pow(1-k,3));
 }
 b.forEach(function(x){
  var t=Math.round(Math.min(Math.max(spiss-x.top-TRINN,-TRINN),x.h));
  if(t!==x.t){x.t=t;x.e.style.setProperty('--t',t+'px')}
 });
 p.forEach(function(x){
  var paa=spiss>=Math.min(x.y+TRINN,slutt+TRINN);
  if(paa!==x.paa){x.paa=paa;x.e.classList.toggle('paa',paa)}
 });
}
function planlegg(){if(!ko)ko=requestAnimationFrame(tegn)}
t0=performance.now();
mal();
addEventListener('scroll',planlegg,{passive:true});
addEventListener('pageshow',planlegg);
addEventListener('resize',function(){if(innerWidth!==bredde){bredde=innerWidth;mal()}else planlegg()});
if(window.ResizeObserver)new ResizeObserver(mal).observe(d.body);
})();
