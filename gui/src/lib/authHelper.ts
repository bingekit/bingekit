import { SitePlugin, CredentialItem } from '../types';
import { resolvePluginUrl } from './urlHelper';
import { ahk } from './ahk';

export const ensureAuthForPlugin = async (plugin: SitePlugin, credentials: CredentialItem[]) => {
  console.log(`[AuthHelper] Starting ensureAuthForPlugin for ${plugin.name}`, { plugin, credentials });

  if (!plugin.auth?.checkAuthJs || (!plugin.auth?.loginUrl && !plugin.auth?.loginUrlJs) || !window.SmartFetch) {
      console.log(`[AuthHelper] Missing auth config or SmartFetch for ${plugin.name}, returning true`);
      return true;
  }
  
  window.showToast?.(`Checking auth state for ${plugin.name}...`, "info");
  
  let resolvedLoginUrl = plugin.baseUrl;
  if (plugin.auth.loginUrl) {
      resolvedLoginUrl = resolvePluginUrl(plugin.baseUrl, plugin.auth.loginUrl);
  }
  console.log(`[AuthHelper] Initial login url resolved to: ${resolvedLoginUrl}`);

  const isAuthJs = `return (function() { try { return !!(eval('(function(){' + ${JSON.stringify(plugin.auth.checkAuthJs)} + '})()')); } catch(e){return false;} })();`;
  
  const checkTargetUrl = plugin.baseUrl || resolvedLoginUrl;
  console.log(`[AuthHelper] Checking if already authenticated via URL: ${checkTargetUrl}`);
  
  const isAuth = await window.SmartFetch(checkTargetUrl, isAuthJs, "", 300000).catch((e) => {
      console.error(`[AuthHelper] isAuth check failed for ${plugin.name}:`, e);
      return false;
  });
  
  if (isAuth) {
     console.log(`[AuthHelper] Already logged in to ${plugin.name}`);
     window.showToast?.(`Already logged in to ${plugin.name}`, "success");
     return true; // Already signed in
  }

  const cred = credentials.find(c => {
      try { return c.domain === new URL(plugin.baseUrl).hostname || c.domain === new URL(resolvedLoginUrl).hostname; } catch(e) { return false; }
  });
  
  if (!cred || (!cred.username && !cred.passwordBase64)) {
      console.warn(`[AuthHelper] No credentials found for ${plugin.name}, skipping auto login.`);
      window.showToast?.(`No credentials found for ${plugin.name}, skipping auto login.`, "warning");
      return false; 
  }
  console.log(`[AuthHelper] Found credentials for ${cred.domain}, attempting login flow.`);

  const rawPass = await ahk.asyncCall('DecryptCredential', cred.passwordBase64) || '';
  
  let combinedBotCheckJs = plugin.botCheckJs || "";
  if (plugin.auth.captchaSel) {
      const captchaSnippet = `if (document.querySelector('${plugin.auth.captchaSel.replace(/'/g, "\\'")}')) return true;`;
      combinedBotCheckJs = (combinedBotCheckJs ? captchaSnippet + " " + combinedBotCheckJs : captchaSnippet);
  }

  if (plugin.auth.loginUrlJs) {
      window.showToast?.(`Fetching dynamic login link for ${plugin.name}...`, "info");
      console.log(`[AuthHelper] Evaluating dynamic loginUrlJs...`);
      const evalJs = `
          return new Promise((resolve) => {
              let attempts = 0;
              let i = setInterval(() => {
                  try {
                      let res = (function() { ${plugin.auth.loginUrlJs} })();
                      if (res) {
                          clearInterval(i);
                          resolve(res);
                      }
                  } catch(e) {}
                  
                  if (++attempts > 30) { // 15 seconds max wait for loginUrl DOM node
                      clearInterval(i);
                      resolve(null);
                  }
              }, 500);
          });
      `;
      const dynamicLink = await window.SmartFetch(plugin.baseUrl, evalJs, combinedBotCheckJs, 300000).catch((e) => {
          console.error(`[AuthHelper] loginUrlJs fetch failed:`, e);
          return null;
      });
      if (dynamicLink && typeof dynamicLink === 'string') {
          resolvedLoginUrl = dynamicLink.startsWith('http') ? dynamicLink : resolvePluginUrl(plugin.baseUrl, dynamicLink);
          console.log(`[AuthHelper] Dynamic login URL evaluated and resolved to: ${resolvedLoginUrl}`);
      } else {
          console.log(`[AuthHelper] Dynamic login URL evaluated to non-string:`, dynamicLink);
      }
  }

  window.showToast?.(`Initiating auto login for ${plugin.name}...`, "info");
  console.log(`[AuthHelper] SmartFetch login payload starting at URL: ${resolvedLoginUrl}`);

  const loginJs = getAutoLoginScript(plugin, cred, rawPass);
  const result = await window.SmartFetch(resolvedLoginUrl, loginJs, combinedBotCheckJs, 300000).catch((e) => {
      console.error(`[AuthHelper] SmartFetch login operation failed entirely:`, e);
      return false;
  });
  
  console.log(`[AuthHelper] Login sequence completed with result:`, result);
  
  if (result) window.showToast?.(`Login successful for ${plugin.name}!`, "success");
  else window.showToast?.(`Login flow timed out or failed for ${plugin.name}.`, "error");
  return result;
};

export const getAutoLoginScript = (plugin: SitePlugin, cred: CredentialItem, rawPass: string) => {
  const un = cred.username || "";
  const pw = rawPass || "";

  if (plugin.auth.customLoginJs) {
      let customJsPayload = plugin.auth.customLoginJs
          .replace(/\{username\}/g, un.replace(/'/g, "\\'"))
          .replace(/\{password\}/g, pw.replace(/'/g, "\\'"));
          
      return `
          return new Promise(resolve => {
              try {
                  console.log("[AutoLogin] Custom login JS start");
                  ${customJsPayload}
                  setTimeout(() => resolve(true), 3000);
              } catch(e) {
                  console.error("[AutoLogin] Custom JS Error:", e);
                  resolve(false);
              }
          });
      `;
  }

  return `
      return new Promise(resolve => {
          let limit = 0;
          let successCheckStr = ${JSON.stringify(plugin.auth.checkAuthJs || "")};
          console.log("[AutoLogin] Starting default interval-based login hook");
          
          let i = setInterval(() => {
              try {
                  let maxLimit = window._svBotDetected ? 600 : 80;
                  if (++limit > maxLimit) { // 5 minutes vs 40 seconds max per page without resolve
                      console.warn("[AutoLogin] Limit " + maxLimit + " reached, aborting. Final state -> userFilled: " + window._svUserFilled + ", passFilled: " + window._svPassFilled);
                      clearInterval(i); 
                      resolve(false); 
                      return;
                  }
                  
                  if (limit % 10 === 0) {
                      console.log("[AutoLogin] Tick " + limit + " | Active DOM scanning ongoing...");
                  }

                  if (successCheckStr) {
                      try {
                          if (eval('(function(){' + successCheckStr + '})()')) { 
                              console.log("[AutoLogin] Logged in successfully based on checkAuthJs");
                              clearInterval(i); 
                              resolve(true); 
                              return;
                          } 
                      } catch(e) {}
                  }

                  // Allow both complete and interactive (meaning DOM is ready, even if images/iframes are still loading)
                  if (!['interactive', 'complete'].includes(document.readyState)) {
                      return;
                  }
                  
                  const isHidden = (el) => (el.offsetParent === null) || window.getComputedStyle(el).display === "none";
                  
                  let uSel = '${plugin.auth.userSel?.replace(/'/g, "\\'") || ""}';
                  let pSel = '${plugin.auth.passSel?.replace(/'/g, "\\'") || ""}';
                  let btnSel = '${plugin.auth.submitSel?.replace(/'/g, "\\'") || ""}';
                  
                  let u = uSel ? document.querySelector(uSel) : null;
                  let p = pSel ? document.querySelector(pSel) : null;
                  let btn = btnSel ? document.querySelector(btnSel) : null;
                  
                  // Resilient Password Manager Fallback - Generic HTML Parsing
                  if (!u) {
                      const userInputs = document.querySelectorAll('input[type="text"]:not([type="hidden"]), input[type="email"]:not([type="hidden"]), input[name*="user"]:not([type="hidden"]), input[name*="email"]:not([type="hidden"]), input[name*="login"]:not([type="hidden"])');
                      for (const el of Array.from(userInputs)) { if (!isHidden(el)) { u = el; break; } }
                  }
                  if (!p) {
                      const passInputs = document.querySelectorAll('input[type="password"]:not([type="hidden"])');
                      for (const el of Array.from(passInputs)) { if (!isHidden(el)) { p = el; break; } }
                  }
                  
                  // Interstitial Bypass Heuristic (Skip 2FA setup screens, App downloads, etc.)
                  if (!u && !p) {
                      let customSkip = null;
                      if ('${plugin.auth.skipSel?.replace(/'/g, "\\'") || ""}' !== '') customSkip = document.querySelector('${plugin.auth.skipSel?.replace(/'/g, "\\'") || ""}');
                      
                      let dismissTargets = Array.from(document.querySelectorAll('a, button, input[type="button"], input[type="submit"]')).filter(el => {
                          if (isHidden(el)) return false;
                          const txt = (el.textContent || el.value || "").toLowerCase().trim();
                          return ['not now', 'skip', 'no thanks', 'remind me later', 'continue without'].includes(txt) || el.id.toLowerCase().includes('skip');
                      });
                      
                      if (customSkip && !isHidden(customSkip)) dismissTargets.unshift(customSkip);
                      
                      if (dismissTargets.length > 0) {
                          if (!window._svClickedSkip || (Date.now() - window._svClickedSkip) > 3000) {
                              console.log("[AutoLogin] Identified interstitial blocker. Attempting bypass...");
                              dismissTargets[0].click();
                              window._svClickedSkip = Date.now();
                          }
                      }
                  }
                  
                  window._svUserFilled = window._svUserFilled || false;
                  window._svPassFilled = window._svPassFilled || false;

                  if (u && !isHidden(u)) {
                      if (u.value !== '${un.replace(/'/g, "\\'")}') {
                          console.log("[AutoLogin] Identified username field dynamically, injecting credentials...");
                          u.value = '${un.replace(/'/g, "\\'")}';
                          u.dispatchEvent(new Event('input', {bubbles:true}));
                          u.dispatchEvent(new Event('change', {bubbles:true}));
                      }
                      window._svUserFilled = true;
                  }

                  if (p && !isHidden(p)) {
                      if (p.value !== '${pw.replace(/'/g, "\\'")}') {
                          console.log("[AutoLogin] Identified password field dynamically, injecting payload...");
                          p.value = '${pw.replace(/'/g, "\\'")}';
                          p.dispatchEvent(new Event('input', {bubbles:true}));
                          p.dispatchEvent(new Event('change', {bubbles:true}));
                      }
                      window._svPassFilled = true;
                  }
                  
                  // If we filled any required field that was visible, try to submit aggressively
                  if ((window._svUserFilled || window._svPassFilled)) {
                      if (!btn && p && p.form) btn = p.form.querySelector('button[type="submit"], input[type="submit"]');
                      if (!btn && u && u.form) btn = u.form.querySelector('button[type="submit"], input[type="submit"]');
                      if (!btn) btn = document.querySelector('button[type="submit"], input[type="submit"]'); // Absolute fallback

                      if (btn && !isHidden(btn)) {
                          if (!window._svClickedBtn || (Date.now() - window._svClickedBtn) > 5000) {
                              console.log("[AutoLogin] Firing submission hook on extracted button target.");
                              btn.click();
                              window._svClickedBtn = Date.now();
                          }
                      } else {
                           if (!window._svClickedBtn || (Date.now() - window._svClickedBtn) > 5000) {
                               console.log("[AutoLogin] Initiating raw semantic form.submit() override.");
                               if (p && p.form) { p.form.submit(); window._svClickedBtn = Date.now(); }
                               else if (u && u.form) { u.form.submit(); window._svClickedBtn = Date.now(); }
                           }
                      }
                  }
              } catch(e) {
                 console.error("[AutoLogin] Critical inner loop error:", e && e.message ? e.message : String(e));
              }
          }, 500);
      });
  `;
};

