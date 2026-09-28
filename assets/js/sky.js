/* Circadian sky for the landing hero.
   One full-screen WebGL pass: graded sky gradient, sun (reddened by air mass), moon, rotating
   star field, drifting cloud streaks, and a three-layer treeline relit by the sky (haze on the far
   ridge, dawn mist, rim light where the low sun catches the tree tops).
   Treeline texture: R = near forest, G = mid ridge, B = far hills (white = tree), tileable.
   Usage: var sky = HXSky(canvas, { trees: url, still: bool }); sky && sky.set(hour 6–30). */
(function () {
  'use strict';

  /* Sky palette by clock hour: [hour, zenith, horizon]. Interpolated in OKLab. */
  var KEYS = [
    [0.0, '#050A1A', '#18264A'],
    [4.2, '#060B1C', '#1A284C'],
    [5.0, '#081026', '#232A4E'],
    [5.6, '#0C1430', '#3A3354'],
    [6.0, '#111A3A', '#5E4050'],
    [6.6, '#15284A', '#6E5448'],
    [7.6, '#143354', '#4E6A6A'],
    [9.5, '#10385A', '#3C676E'],
    [12.0, '#0F3A5C', '#3A6870'],
    [15.5, '#113758', '#46686A'],
    [17.0, '#172E52', '#6A6250'],
    [17.7, '#1B2548', '#82503E'],
    [18.0, '#1C1F44', '#7E3E48'],
    [18.5, '#151A40', '#4E3358'],
    [19.2, '#0D1432', '#28305A'],
    [20.0, '#0A112A', '#1C2850'],
    [21.0, '#070D20', '#18264A'],
    [24.0, '#050A1A', '#18264A']
  ];

  var VERT = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';

  var FRAG = [
    'precision highp float;',
    'uniform vec2 uRes;uniform float uScale;uniform float uT;',
    'uniform vec3 uZen;uniform vec3 uHor;uniform vec3 uSunCol;uniform vec3 uTreeAmb;',
    'uniform vec4 uSun;',   // x, y (css px from bottom-left), elevation, disc visibility
    'uniform vec4 uMoon;',  // x, y, visibility, -
    'uniform vec4 uAmt;',   // glow, stars, mist, clouds
    'uniform vec4 uMisc;',  // rim, cloud brightness, trees ready, star rotation
    'uniform vec4 uLand;',  // horizon y, tree strip height, texture aspect, -
    'uniform vec4 uMist;',  // mist band in strip rows (0 = top): fade-in start/end, fade-out start/end
    'uniform vec4 uScrim;', // cx, cy, rx, ry
    'uniform sampler2D uTrees;',
    'float h12(vec2 p){vec3 q=fract(vec3(p.xyx)*.1031);q+=dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}',
    'vec2 h22(vec2 p){vec3 q=fract(vec3(p.xyx)*vec3(.1031,.1030,.0973));q+=dot(q,q.yzx+33.33);return fract((q.xx+q.yz)*q.zy);}',
    'float noise(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);',
    '  return mix(mix(h12(i),h12(i+vec2(1,0)),u.x),mix(h12(i+vec2(0,1)),h12(i+vec2(1,1)),u.x),u.y);}',
    'float fbm(vec2 p){float a=.5,s=0.;for(int i=0;i<5;i++){s+=a*noise(p);p=mat2(1.6,1.2,-1.2,1.6)*p;a*=.5;}return s;}',
    'float sq(float x){return x*x;}',
    'float fbm3(vec2 p){float a=.5,s=0.;for(int i=0;i<3;i++){s+=a*noise(p);p=mat2(1.6,1.2,-1.2,1.6)*p;a*=.5;}return s/.875;}',

    'vec3 stars(vec2 q,float v){',
    '  vec2 piv=vec2(uRes.x*.5,-uRes.y*1.3);float c=cos(uMisc.w),s=sin(uMisc.w);',
    '  vec2 p=mat2(c,-s,s,c)*(q-piv);vec3 acc=vec3(0.);',
    '  for(int L=0;L<2;L++){',
    '    float cell=L==0?52.:19.;vec2 id=floor(p/cell);vec2 f=fract(p/cell);',
    '    vec2 hh=h22(id+float(L)*57.3);float h3=h12(id*1.37+11.+float(L)*9.1);',
    '    vec2 d=(f-(.18+.64*hh))*cell;',
    '    float mag=L==0?pow(h3,2.5)*step(.4,h12(id+3.7)):pow(h3,6.)*.55;',
    '    float sz=.7+1.05*mag;',
    '    float tw=.7+.3*sin(uT*(1.1+2.6*hh.x)+h3*47.);',
    '    vec3 sc=mix(vec3(.74,.84,1.),vec3(1.,.87,.7),hh.y*hh.y);',
    '    acc+=sc*exp(-dot(d,d)/(sz*sz))*mag*tw;',
    '  }',
    '  return acc*1.9*smoothstep(.0,.45,v);',
    '}',

    'void main(){',
    '  vec2 q=gl_FragCoord.xy/uScale;float H=uRes.y;float hz=uLand.x;',
    '  float v=clamp((q.y-hz)/(H-hz),0.,1.);',
    '  vec3 col=mix(uZen,uHor,exp(-v*3.1));',
    // sun glow: tight halo + broad bloom + a band that spreads along the horizon
    '  vec2 sp=uSun.xy;float d=length(q-sp)/H;float g=uAmt.x;',
    '  float spread=exp(-pow(max(q.y-hz,0.)/(H*.2),1.15))*exp(-sq((q.x-sp.x)/(H*1.3)));',
    '  col+=uSunCol*g*(.5*exp(-d*d*55.)+.3*exp(-d*3.4)+.55*spread);',
    '  vec3 atm=col;',
    // stars and moon
    '  if(uAmt.y>.001)col+=stars(q,v)*uAmt.y;',
    '  if(uMoon.z>.001){',
    '    vec2 mq=q-uMoon.xy;float md=length(mq);float r=9.5;',
    '    float disc=smoothstep(r+.9,r-.9,md);',
    '    float sh=smoothstep(r+1.2,r-1.2,length(mq+vec2(r*1.5,-r*.2)));',
    '    float mar=fbm3(mq*.32+4.);',
    '    vec3 mc=vec3(1.,.97,.9)*(.62+.5*mar);',
    '    col=mix(col,mc*1.25,disc*(1.-sh*.93)*uMoon.z);',
    '    col+=vec3(.5,.6,.9)*(exp(-md/40.)*.06+exp(-md*md/(H*H*.09))*.03)*uMoon.z;',
    '  }',
    // clouds: thin wind-stretched streaks, underlit near the sun
    '  if(uAmt.w>.001&&v>.02&&v<.8){',
    '    vec2 cp=vec2(q.x/H*1.05+uT*.0035,(q.y-hz)/H*6.2);',
    '    float w=fbm(cp*vec2(.7,1.)+vec2(uT*.002,0.));',
    '    float n=fbm(cp+vec2(w*1.6,w*.35));',
    '    float band=smoothstep(.03,.16,v)*(1.-smoothstep(.42,.78,v));',
    '    float cl=smoothstep(.54,.84,n)*band*uAmt.w;',
    '    float prox=exp(-sq((q.x-sp.x)/(H*.95)))*exp(-pow(max(q.y-hz,0.)/(H*.55),1.2));',
    '    vec3 cc=mix(uHor,uZen,.45)*uMisc.y+uSunCol*g*prox*1.7+vec3(.5,.6,.9)*uMoon.z*.02*exp(-length(q-uMoon.xy)/(H*.3));',
    '    col=mix(col,cc,cl*.8);',
    '  }',
    // sun disc and lens bloom
    '  if(uSun.w>.001){float sd=length(q-sp);',
    '    col+=(uSunCol*2.5+vec3(.3,.26,.2)*uSunCol.g)*smoothstep(12.,10.,sd)*uSun.w;',
    '    col+=uSunCol*(exp(-sd/14.)*.55+exp(-sd/55.)*.14)*uSun.w;}',
    // treeline
    '  if(uMisc.z>.001&&q.y<uLand.y){',
    '    float tw=uLand.y*uLand.z;float ty=1.-q.y/uLand.y;',
    '    vec3 tm=texture2D(uTrees,vec2(q.x/tw,ty)).rgb;float nearM=tm.r;',
    '    float midM=tm.g;',
    '    float farM=tm.b;',
    '    float prox=exp(-sq((q.x-sp.x)/(H*.8)));float rimP=exp(-sq((q.x-sp.x)/(H*.32)));',
    '    vec3 farC=mix(uTreeAmb,atm,.52);',
    '    col=mix(col,farC,farM*uMisc.z);',
    '    float mn=fbm3(vec2(q.x*.0045+uT*.012,q.y*.024-uT*.004));',
    '    float mb=smoothstep(uMist.x,uMist.y,ty)*(1.-smoothstep(uMist.z,uMist.w,ty));',
    '    float mist=uAmt.z*mb*smoothstep(.28,.78,mn);',
    '    col=mix(col,atm*1.3+uSunCol*g*prox*.35,mist*.75*uMisc.z);',
    '    vec3 midC=mix(uTreeAmb,atm,.2);',
    '    col=mix(col,midC,midM*uMisc.z);',
    '    vec2 ts=normalize(sp-q+vec2(0.,.01));float o=1.4;',
    '    float nearS=texture2D(uTrees,vec2((q.x+ts.x*o)/tw,1.-(q.y+ts.y*o)/uLand.y)).r;',
    '    float rim=nearM*(1.-nearS);',
    '    vec3 nearC=uTreeAmb*(1.-.35*smoothstep(.75,1.,ty))+uSunCol*rim*uMisc.x*rimP*.6;',
    '    col=mix(col,nearC,nearM*uMisc.z);',
    '  }',
    // text scrim behind the headline
    '  vec2 sq=(q-uScrim.xy)/max(uScrim.zw,vec2(1.));col*=1.-.36*exp(-dot(sq,sq)*1.3);',
    // highlight roll-off, gamma, dither, grain
    '  col=max(col,0.);vec3 k=vec3(.6);',
    '  col=mix(col,k+(1.-k)*(1.-exp(-(col-k)/(1.-k))),step(k,col));',
    '  vec3 o2=pow(col,vec3(1./2.2));',
    '  float ign=fract(52.9829189*fract(dot(gl_FragCoord.xy,vec2(.06711056,.00583715))));',
    '  o2+=(ign-.5)/255.+(h12(gl_FragCoord.xy+fract(uT*.37)*517.)-.5)*.012;',
    '  gl_FragColor=vec4(o2,1.);',
    '}'
  ].join('\n');

  /* ---------- colour helpers ---------- */
  function hexLin(hex) {
    var n = parseInt(hex.slice(1), 16), c = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    return c.map(function (x) { x /= 255; return x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); });
  }
  function linLab(c) {
    var l = Math.cbrt(0.4122214708 * c[0] + 0.5363325363 * c[1] + 0.0514459929 * c[2]);
    var m = Math.cbrt(0.2119034982 * c[0] + 0.6806995451 * c[1] + 0.1073969566 * c[2]);
    var s = Math.cbrt(0.0883024619 * c[0] + 0.2817188376 * c[1] + 0.6299787005 * c[2]);
    return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
  }
  function labLin(L) {
    var l = L[0] + 0.3963377774 * L[1] + 0.2158037573 * L[2], m = L[0] - 0.1055613458 * L[1] - 0.0638541728 * L[2], s = L[0] - 0.0894841775 * L[1] - 1.291485548 * L[2];
    l = l * l * l; m = m * m * m; s = s * s * s;
    return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s].map(function (x) { return Math.max(0, x); });
  }
  var LAB = KEYS.map(function (k) { return [k[0], linLab(hexLin(k[1])), linLab(hexLin(k[2]))]; });
  function palette(h24) {
    for (var i = 0; i < LAB.length - 1; i++) {
      var a = LAB[i], b = LAB[i + 1];
      if (h24 >= a[0] && h24 <= b[0]) {
        var t = (h24 - a[0]) / (b[0] - a[0]);
        var mix = function (x, y) { return labLin([0, 1, 2].map(function (j) { return x[j] + (y[j] - x[j]) * t; })); };
        return [mix(a[1], b[1]), mix(a[2], b[2])];
      }
    }
    return [labLin(LAB[0][1]), labLin(LAB[0][2])];
  }
  var smooth = function (a, b, x) { var t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

  function HXSky(canvas, opts) {
    opts = opts || {};
    var gl;
    try { gl = canvas.getContext('webgl', { alpha: false, antialias: false, depth: false, stencil: false, premultipliedAlpha: false, preserveDrawingBuffer: true, powerPreference: 'low-power' }); } catch (e) { gl = null; }
    if (!gl) return null;

    function shader(type, src) {
      var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { if (window.console) console.warn('sky shader:', gl.getShaderInfoLog(s)); return null; }
      return s;
    }
    var vs = shader(gl.VERTEX_SHADER, VERT), fs = shader(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return null;
    var prog = gl.createProgram(); gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
    gl.useProgram(prog);
    var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    var U = {};
    ['uRes', 'uScale', 'uT', 'uZen', 'uHor', 'uSunCol', 'uTreeAmb', 'uSun', 'uMoon', 'uAmt', 'uMisc', 'uLand', 'uMist', 'uScrim', 'uTrees'].forEach(function (n) { U[n] = gl.getUniformLocation(prog, n); });

    var treesReady = 0, treeAspect = 8, treeFade = 0;
    var tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0]));
    gl.uniform1i(U.uTrees, 0);
    if (opts.trees) {
      var img = new Image();
      img.onload = function () {
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
        var pot = (img.width & (img.width - 1)) === 0 && (img.height & (img.height - 1)) === 0;
        if (pot) { gl.generateMipmap(gl.TEXTURE_2D); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); }
        else gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, pot ? gl.REPEAT : gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        treeAspect = img.width / img.height; treesReady = 1;
        if (opts.still) { treeFade = 1; now(); }
        dirty = true; kick();
      };
      img.src = opts.trees;
    }

    var W = 0, H = 0, scale = 1, maxScale = Math.min(window.devicePixelRatio || 1, 1.5);
    var hour = 7, dirty = true, visible = true, raf = 0, t0 = performance.now(), frozenT = 12.0;
    var HZ = opts.horizon || 0.5, MIST = opts.mist || [0.36, 0.52, 0.62, 0.8];
    var scrim = [0, 0, 1, 1], slow = 0, frames = 0, ceiling = 1e9, track = 0;

    function size() {
      var r = canvas.getBoundingClientRect();
      W = Math.max(1, r.width); H = Math.max(1, r.height);
      canvas.width = Math.round(W * scale); canvas.height = Math.round(H * scale);
      gl.viewport(0, 0, canvas.width, canvas.height);
      ceiling = 1e9;
      if (opts.chart) { var c = opts.chart.getBoundingClientRect(); track = r.bottom - c.top; }
      (opts.avoid || []).forEach(function (el) {
        var b = el && el.getBoundingClientRect();
        if (b && b.height) ceiling = Math.min(ceiling, r.bottom - b.bottom - 34);
      });
      if (opts.scrim) {
        var s = opts.scrim.getBoundingClientRect();
        scrim = [s.left - r.left + s.width * 0.42, r.bottom - (s.top + s.height * 0.5), s.width * 0.62, s.height * 0.62];
      }
      dirty = true;
      now();
    }
    // resizing clears the canvas: repaint straight away instead of waiting for a (possibly throttled) frame
    function now() { if (U.uRes && visible && !document.hidden) { draw(performance.now()); dirty = false; } }
    scale = maxScale; size();
    if ('ResizeObserver' in window) new ResizeObserver(function () { size(); kick(); }).observe(canvas);
    else window.addEventListener('resize', function () { size(); kick(); });

    function path(h) {
      var s = Math.sin(2 * Math.PI * (h - 6) / 24);
      // the strip is sized so its far ridge sits just under the sun's lane at the top of the chart
      var strip = Math.max(120, Math.min(track ? (track - 58) / HZ : H * 0.36, 360, W * 0.62));
      var horizon = strip * HZ;
      // the sun and moon ride a lane across the top of the chart, above the highest point of the curves
      var base = (track || strip * 0.85) - 26, up = 12, down = 10;
      var sun = Math.min(base + up * Math.max(s, 0) - down * Math.max(-s, 0), ceiling);
      var moon = Math.min(base + up * Math.max(-s, 0) - down * Math.max(s, 0), ceiling);
      return { s: s, strip: strip, horizon: horizon, x: (h - 6) / 24 * W, sun: sun, moon: moon };
    }
    function draw(now) {
      var h = hour, h24 = ((h % 24) + 24) % 24;
      var pal = palette(h24);
      var P = path(h), s = P.s, strip = P.strip, horizon = P.horizon, px = P.x, sunY = P.sun;
      var am = 1 / (Math.max(s, 0) + 0.035);
      am = Math.min(am, 30);
      var sunCol = [0.021, 0.05, 0.12].map(function (b) { return Math.exp(-b * am); });
      var dayness = smooth(-0.1, 0.3, s);
      var glow = s > 0 ? (0.2 + 0.8 * Math.exp(-s * 4.5)) * (0.55 + 0.45 * dayness) : 1.0 * Math.exp(s / 0.09);
      var bright = 0.55 + 0.5 * dayness;
      sunCol = sunCol.map(function (c) { return c * bright; });
      var disc = smooth(-0.03, 0.02, s) * (1 - 0.55 * smooth(0.35, 0.9, s));
      var moonVis = smooth(-0.02, 0.06, -s);
      var starsA = 1 - smooth(-0.26, -0.03, s);
      var mist = 0.18 + 0.82 * Math.exp(-Math.pow((h24 - 6.9) / 1.5, 2)) + 0.2 * (1 - dayness);
      var rim = Math.exp(-Math.max(s, 0) * 5.5) * smooth(-0.08, 0.0, s);
      var cloudK = 0.6 + 0.85 * dayness;
      var amb = [0.0045, 0.0085, 0.0065].map(function (c, i) { return c + (pal[0][i] * 0.14 + pal[1][i] * 0.08); });
      var t = opts.still ? frozenT : (now - t0) / 1000;

      if (treesReady && treeFade < 1) treeFade = Math.min(1, treeFade + 0.04);

      gl.uniform2f(U.uRes, W, H); gl.uniform1f(U.uScale, scale); gl.uniform1f(U.uT, t);
      gl.uniform3fv(U.uZen, pal[0]); gl.uniform3fv(U.uHor, pal[1]);
      gl.uniform3fv(U.uSunCol, sunCol); gl.uniform3fv(U.uTreeAmb, amb);
      gl.uniform4f(U.uSun, px, sunY, s, disc);
      gl.uniform4f(U.uMoon, px, P.moon, moonVis, 0);
      gl.uniform4f(U.uAmt, glow, starsA, mist, 0.75);
      gl.uniform4f(U.uMisc, rim, cloudK, treesReady * treeFade, h * 15 * Math.PI / 180 * 0.3);
      gl.uniform4f(U.uLand, horizon, strip, treeAspect, 0);
      gl.uniform4f(U.uMist, MIST[0], MIST[1], MIST[2], MIST[3]);
      gl.uniform4f(U.uScrim, scrim[0], scrim[1], scrim[2], scrim[3]);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    var last = 0;
    function frame(now) {
      raf = 0;
      if (!visible || document.hidden) return;
      var dt = now - last;
      var animating = !opts.still;
      if (dirty || (animating && dt > 30) || (treesReady && treeFade < 1)) {
        var a = performance.now();
        draw(now); dirty = false; last = now;
        // adaptive resolution: drop to 1x, then 0.75x, if frames run long
        if (animating && ++frames > 20) {
          var cost = performance.now() - a;
          slow = slow * 0.9 + (cost > 12 ? 1 : 0) * 0.1;
          if (slow > 0.5 && scale > 0.75) { scale = scale > 1 ? 1 : 0.75; slow = 0; frames = 0; size(); }
        }
      }
      if (animating || dirty || (treesReady && treeFade < 1)) raf = requestAnimationFrame(frame);
    }
    function kick() { if (!raf) raf = requestAnimationFrame(frame); }

    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) { dirty = true; kick(); } }).observe(canvas);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) { dirty = true; kick(); } });
    canvas.addEventListener('webglcontextlost', function (e) { e.preventDefault(); if (opts.onLost) opts.onLost(); });

    kick();
    return {
      set: function (h) { if (h !== hour) { hour = h; dirty = true; if (opts.still) now(); kick(); } },
      body: function (h) { var P = path(h); return P.s >= -0.01 ? { y: P.sun, sun: true } : { y: P.moon, sun: false }; },
      resize: function () { size(); kick(); }
    };
  }

  window.HXSky = HXSky;
})();
