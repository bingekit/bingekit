import { SitePlugin, CredentialItem } from '../types';
import { resolvePluginUrl } from './urlHelper';

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

  const rawPass = atob(cred.passwordBase64);
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
  return await window.SmartFetch(resolvedLoginUrl, loginJs).catch(() => false);
};
