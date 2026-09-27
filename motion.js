/*
 * V8 motion configuration.
 * Counts and distances are CSS-pixel values; change these bands to tune density.
 */
const CONFIG = Object.freeze({
  particles: Object.freeze({desktop:108, tablet:68, mobile:38}),
  lineDistance: Object.freeze({desktop:132, tablet:112, mobile:92}),
  mouseRadius: Object.freeze({desktop:150, tablet:120, mobile:95}),
  colors: Object.freeze(["0,240,255","123,45,255","45,123,255"]),
  particleOpacity: Object.freeze({min:.34,max:.58}),
  revealDuration:600,
  revealThreshold:.15,
  navScrollOffset:50
});

function motionBand(width) {
  return width < 640 ? "mobile" : (width < 1024 ? "tablet" : "desktop");
}

/* Replaces the original particle loop while retaining its existing canvas. */
initTechParticles = function initTechParticlesV8() {
  const canvas = document.getElementById("techParticles");
  if (!canvas || !canvas.getContext) return;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) { canvas.style.display = "none"; return; }
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  let width=0, height=0, band="desktop", dots=[], frameId=0, resizeId=0, running=false;
  const pointer={x:-10000,y:-10000,active:false};

  function sizeCanvas() {
    const dpr=Math.min(window.devicePixelRatio || 1,2);
    width=window.innerWidth; height=window.innerHeight; band=motionBand(width);
    canvas.width=Math.round(width*dpr); canvas.height=Math.round(height*dpr);
    canvas.style.width=width+"px"; canvas.style.height=height+"px";
    ctx.setTransform(dpr,0,0,dpr,0,0);
    dots=Array.from({length:CONFIG.particles[band]},(_,i)=>({
      x:Math.random()*width,y:Math.random()*height,
      vx:(Math.random()-.5)*.35,vy:(Math.random()-.5)*.35,
      radius:.8+Math.random()*1.3,
      color:CONFIG.colors[i%CONFIG.colors.length],
      alpha:CONFIG.particleOpacity.min+Math.random()*(CONFIG.particleOpacity.max-CONFIG.particleOpacity.min)
    }));
  }

  function draw() {
    if (!running) return;
    ctx.clearRect(0,0,width,height);
    const reach=CONFIG.lineDistance[band], reach2=reach*reach;
    const pointerReach=CONFIG.mouseRadius[band];
    for(let i=0;i<dots.length;i++){
      const p=dots[i];
      if(pointer.active){
        const dx=p.x-pointer.x,dy=p.y-pointer.y,dist2=dx*dx+dy*dy;
        if(dist2<pointerReach*pointerReach && dist2>1){
          const dist=Math.sqrt(dist2), influence=(1-dist/pointerReach)*.012;
          p.vx+=dx/dist*influence; p.vy+=dy/dist*influence;
        }
      }
      p.vx=Math.max(-.4,Math.min(.4,p.vx*.996));
      p.vy=Math.max(-.4,Math.min(.4,p.vy*.996));
      p.x=(p.x+p.vx+width)%width; p.y=(p.y+p.vy+height)%height;
      ctx.beginPath();ctx.fillStyle="rgba("+p.color+","+p.alpha.toFixed(2)+")";
      ctx.arc(p.x,p.y,p.radius,0,Math.PI*2);ctx.fill();
      for(let j=i+1;j<dots.length;j++){
        const q=dots[j], dx=p.x-q.x,dy=p.y-q.y,dist2=dx*dx+dy*dy;
        if(dist2>=reach2)continue;
        ctx.beginPath();
        ctx.strokeStyle="rgba(0,240,255,"+((1-dist2/reach2)*.23).toFixed(3)+")";
        ctx.lineWidth=.6;ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.stroke();
      }
    }
    frameId=requestAnimationFrame(draw);
  }
  function resume(){if(running||document.hidden)return;running=true;frameId=requestAnimationFrame(draw)}
  function pause(){running=false;cancelAnimationFrame(frameId)}
  sizeCanvas();resume();
  window.addEventListener("resize",()=>{
    if(resizeId)cancelAnimationFrame(resizeId);
    resizeId=requestAnimationFrame(()=>{resizeId=0;sizeCanvas()});
  },{passive:true});
  window.addEventListener("pointermove",e=>{
    if(e.pointerType==="touch")return;
    pointer.x=e.clientX;pointer.y=e.clientY;pointer.active=true;
  },{passive:true});
  document.addEventListener("pointerleave",()=>{pointer.active=false});
  document.addEventListener("visibilitychange",()=>document.hidden?pause():resume());
  window.addEventListener("pagehide",pause,{once:true});
};

/* Scroll reveals are attached only once and refreshed after existing card renders. */
const motionReveal=(()=>{
  let observer=null,scheduled=0;
  const selector=".landing-hero .hero-copy,.landing-hero .hero-art,.section-heading,.subcategory-bar,.product-card,.shop-fold";
  function scan(){
    scheduled=0;if(!observer)return;
    document.querySelectorAll(selector).forEach(el=>{
      if(el.classList.contains("reveal-ready"))return;
      el.classList.add("reveal-ready");observer.observe(el);
    });
  }
  return {
    init(){
      if(matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window))return;
      document.documentElement.classList.add("motion-enabled");
      observer=new IntersectionObserver(entries=>{
        for(const entry of entries){
          if(!entry.isIntersecting)continue;
          entry.target.classList.add("is-visible");observer.unobserve(entry.target);
        }
      },{threshold:CONFIG.revealThreshold});
      scan();
    },
    schedule(){if(observer&&!scheduled)scheduled=requestAnimationFrame(scan)}
  };
})();
const renderBeforeMotion=render;
render=function renderWithMotion(){renderBeforeMotion();motionReveal.schedule()};

function initNavMotion(){
  const nav=document.getElementById("floatingNav");
  if(!nav)return;
  let pending=false;
  function update(){pending=false;nav.classList.toggle("scrolled",window.scrollY>CONFIG.navScrollOffset)}
  window.addEventListener("scroll",()=>{
    if(pending)return;
    pending=true;requestAnimationFrame(update);
  },{passive:true});
  update();
}
function initMotionEnhancements(){motionReveal.init();initNavMotion()}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",initMotionEnhancements);
else initMotionEnhancements();

