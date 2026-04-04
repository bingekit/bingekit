import { SitePlugin, CredentialItem } from '../types';
import { resolvePluginUrl } from './urlHelper';
import { ahk } from './ahk';

export const ensureAuthForPlugin = async (plugin: SitePlugin, credentials: CredentialItem[]) => {
  if (!plugin.auth?.checkAuthJs || !plugin.auth?.loginUrl || !window.SmartFetch) return true;
  
  const resolvedLoginUrl = resolvePluginUrl(plugin.baseUrl, plugin.auth.loginUrl);
  const checkTargetUrl = plugin.baseUrl || resolvedLoginUrl;
  const isAuthJs = `return (function() { try { return !!(eval('(function(){' + ${JSON.stringify(plugin.auth.checkAuthJs)} + '})()')); } catch(e){return false;} })();`;
  const isAuth = await window.SmartFetch(checkTargetUrl, isAuthJs).catch(() => false);
  
  if (isAuth) return true; // Already signed in

  const cred = credentials.find(c => {
      try { return c.domain === new URL(plugin.baseUrl).hostname || c.domain === new URL(resolvedLoginUrl).hostname; } catch(e) { return false; }
  });
  if (!cred || (!cred.username && !cred.passwordBase64)) return false; // Missing creds, can't auto-login

  const rawPass = await ahk.asyncCall('DecryptCredential', cred.passwordBase64) || '';
  
  if (plugin.auth.customLoginJs) {
      let customJsPayload = plugin.auth.customLoginJs
          .replace(/\{username\}/g, cred.username.replace(/'/g, "\\'"))
          .replace(/\{password\}/g, rawPass.replace(/'/g, "\\'"));
          
      const evalJs = `
          return new Promise(resolve => {
              try {
                  ${customJsPayload}
                  setTimeout(() => resolve(true), 3000);
              } catch(e) {
                  resolve(false);
              }
          });
      `;
      return await window.SmartFetch(resolvedLoginUrl, evalJs, plugin.botCheckJs || "").catch(() => false);
  }

  const loginJs = `
      return new Promise(resolve => {
          let limit = 0;
          let i = setInterval(() => {
              const u = document.querySelector('${plugin.auth.userSel?.replace(/'/g, "\\'") || ""}');
              const p = document.querySelector('${plugin.auth.passSel?.replace(/'/g, "\\'") || ""}');
              const btn = document.querySelector('${plugin.auth.submitSel?.replace(/'/g, "\\'") || ""}');
              
              if (u && p && btn) {
                  u.value = '${cred.username.replace(/'/g, "\\'")}';
                  p.value = '${rawPass.replace(/'/g, "\\'")}';
                  btn.click();
                  clearInterval(i);
                  setTimeout(() => resolve(true), 3000);
              }
              if (++limit > 20) { clearInterval(i); resolve(false); }
          }, 500);
      });
  `;
  return await window.SmartFetch(resolvedLoginUrl, loginJs, plugin.botCheckJs || "").catch(() => false);
};
