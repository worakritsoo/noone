function t(){}function n(t,n){for(const e in n)t[e]=n[e];return t}function e(t){return t()}function o(){return Object.create(null)}function r(t){t.forEach(e)}function c(t){return"function"==typeof t}function u(t,n){return t!=t?n==n:t!==n||t&&"object"==typeof t||"function"==typeof t}function s(t,n,e,o){if(t){const r=i(t,n,e,o);return t[0](r)}}function i(t,e,o,r){return t[1]&&r?n(o.ctx.slice(),t[1](r(e))):o.ctx}function f(t,n,e,o,r,c,u){const s=function(t,n,e,o){if(t[2]&&o){const r=t[2](o(e));if(void 0===n.dirty)return r;if("object"==typeof r){const t=[],e=Math.max(n.dirty.length,r.length);for(let o=0;o<e;o+=1)t[o]=n.dirty[o]|r[o];return t}return n.dirty|r}return n.dirty}(n,o,r,c);if(s){const r=i(n,e,o,u);t.p(r,s)}}function a(t,n){t.appendChild(n)}function l(t,n,e){t.insertBefore(n,e||null)}function d(t){t.parentNode.removeChild(t)}function h(t,n){for(let e=0;e<t.length;e+=1)t[e]&&t[e].d(n)}function p(t){return document.createElement(t)}function g(t){return document.createTextNode(t)}function $(){return g(" ")}function m(){return g("")}function b(t,n,e,o){return t.addEventListener(n,e,o),()=>t.removeEventListener(n,e,o)}function y(t,n,e){null==e?t.removeAttribute(n):t.getAttribute(n)!==e&&t.setAttribute(n,e)}function x(t){return Array.from(t.childNodes)}function _(t,n,e,o){for(let r=0;r<t.length;r+=1){const o=t[r];if(o.nodeName===n){let n=0;const c=[];for(;n<o.attributes.length;){const t=o.attributes[n++];e[t.name]||c.push(t.name)}for(let t=0;t<c.length;t++)o.removeAttribute(c[t]);return t.splice(r,1)[0]}}return o?function(t){return document.createElementNS("http://www.w3.org/2000/svg",t)}(n):p(n)}function v(t,n){for(let e=0;e<t.length;e+=1){const o=t[e];if(3===o.nodeType)return o.data=""+n,t.splice(e,1)[0]}return g(n)}function w(t){return v(t," ")}function E(t,n){n=""+n,t.wholeText!==n&&(t.data=n)}function k(t,n){t.value=null==n?"":n}let j;function A(t){j=t}function N(){if(!j)throw new Error("Function called outside component initialization");return j}function O(t){N().$$.on_mount.push(t)}function S(t){N().$$.after_update.push(t)}function C(t,n){N().$$.context.set(t,n)}const T=[],q=[],z=[],B=[],F=Promise.resolve();let L=!1;function M(t){z.push(t)}let D=!1;const G=new Set;function H(){if(!D){D=!0;do{for(let t=0;t<T.length;t+=1){const n=T[t];A(n),I(n.$$)}for(A(null),T.length=0;q.length;)q.pop()();for(let t=0;t<z.length;t+=1){const n=z[t];G.has(n)||(G.add(n),n())}z.length=0}while(T.length);for(;B.length;)B.pop()();L=!1,D=!1,G.clear()}}function I(t){if(null!==t.fragment){t.update(),r(t.before_update);const n=t.dirty;t.dirty=[-1],t.fragment&&t.fragment.p(t.ctx,n),t.after_update.forEach(M)}}const J=new Set;let K;function P(){K={r:0,c:[],p:K}}function Q(){K.r||r(K.c),K=K.p}function R(t,n){t&&t.i&&(J.delete(t),t.i(n))}function U(t,n,e,o){if(t&&t.o){if(J.has(t))return;J.add(t),K.c.push((()=>{J.delete(t),o&&(e&&t.d(1),o())})),t.o(n)}}function V(t,n){const e={},o={},r={$$scope:1};let c=t.length;for(;c--;){const u=t[c],s=n[c];if(s){for(const t in u)t in s||(o[t]=1);for(const t in s)r[t]||(e[t]=s[t],r[t]=1);t[c]=s}else for(const t in u)r[t]=1}for(const u in o)u in e||(e[u]=void 0);return e}function W(t){return"object"==typeof t&&null!==t?t:{}}function X(t){t&&t.c()}function Y(t,n){t&&t.l(n)}function Z(t,n,o,u){const{fragment:s,on_mount:i,on_destroy:f,after_update:a}=t.$$;s&&s.m(n,o),u||M((()=>{const n=i.map(e).filter(c);f?f.push(...n):r(n),t.$$.on_mount=[]})),a.forEach(M)}function tt(t,n){const e=t.$$;null!==e.fragment&&(r(e.on_destroy),e.fragment&&e.fragment.d(n),e.on_destroy=e.fragment=null,e.ctx=[])}function nt(t,n){-1===t.$$.dirty[0]&&(T.push(t),L||(L=!0,F.then(H)),t.$$.dirty.fill(0)),t.$$.dirty[n/31|0]|=1<<n%31}function et(n,e,c,u,s,i,f=[-1]){const a=j;A(n);const l=n.$$={fragment:null,ctx:null,props:i,update:t,not_equal:s,bound:o(),on_mount:[],on_destroy:[],on_disconnect:[],before_update:[],after_update:[],context:new Map(a?a.$$.context:e.context||[]),callbacks:o(),dirty:f,skip_bound:!1};let h=!1;if(l.ctx=c?c(n,e.props||{},((t,e,...o)=>{const r=o.length?o[0]:e;return l.ctx&&s(l.ctx[t],l.ctx[t]=r)&&(!l.skip_bound&&l.bound[t]&&l.bound[t](r),h&&nt(n,t)),e})):[],l.update(),h=!0,r(l.before_update),l.fragment=!!u&&u(l.ctx),e.target){if(e.hydrate){const t=x(e.target);l.fragment&&l.fragment.l(t),t.forEach(d)}else l.fragment&&l.fragment.c();e.intro&&R(n.$$.fragment),Z(n,e.target,e.anchor,e.customElement),H()}A(a)}class ot{$destroy(){tt(this,1),this.$destroy=t}$on(t,n){const e=this.$$.callbacks[t]||(this.$$.callbacks[t]=[]);return e.push(n),()=>{const t=e.indexOf(n);-1!==t&&e.splice(t,1)}}$set(t){var n;this.$$set&&(n=t,0!==Object.keys(n).length)&&(this.$$.skip_bound=!0,this.$$set(t),this.$$.skip_bound=!1)}}const rt=[];function ct(n,e=t){let o;const r=[];function c(t){if(u(n,t)&&(n=t,o)){const t=!rt.length;for(let e=0;e<r.length;e+=1){const t=r[e];t[1](),rt.push(t,n)}if(t){for(let t=0;t<rt.length;t+=2)rt[t][0](rt[t+1]);rt.length=0}}}return{set:c,update:function(t){c(t(n))},subscribe:function(u,s=t){const i=[u,s];return r.push(i),1===r.length&&(o=e(c)||t),u(n),()=>{const t=r.indexOf(i);-1!==t&&r.splice(t,1),0===r.length&&(o(),o=null)}}}}export{n as A,P as B,ct as C,a as D,t as E,s as F,f as G,k as H,b as I,h as J,r as K,ot as S,x as a,y as b,_ as c,d,p as e,l as f,v as g,E as h,et as i,X as j,$ as k,m as l,Y as m,w as n,Z as o,V as p,W as q,U as r,u as s,g as t,Q as u,R as v,tt as w,C as x,S as y,O as z};
