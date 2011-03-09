/* vim:set ts=2 sw=2 sts=2 et:
 * ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Developer Tools installer.
 *
 * The Initial Developer of the Original Code is
 * Mozilla Corporation.
 * Portions created by the Initial Developer are Copyright (C) 2011
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Mihai Sucan <mihai.sucan@gmail.com> (Original Author)
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK *****/

const Ci = Components.interfaces;
const Cu = Components.utils;

const NS_XUL = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";
const MIME_XPI = "application/x-xpinstall";
const DEVTOOLS_POST_INSTALL_PAGE = "http://mozilla.org/devtools-post-install";
const DEVTOOLS_POST_UPGRADE_PAGE = "http://mozilla.org/devtools-post-upgrade";

const DEVTOOLS_ADDONS = {
  uaswitcher: {
    id: "{e968fc70-8f95-4ab9-9e79-304de2a71ee1}",
    url: "https://addons.mozilla.org/firefox/downloads/latest/59/addon-59-latest.xpi?src=addondetail"
  },
};

Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/AddonManager.jsm");

let recentWindow = Services.wm.getMostRecentWindow("navigator:browser");
let gBrowser = recentWindow ? recentWindow.gBrowser : null;

// TODO: check if Firefox is beta or not.
let isBetaBrowser = false;

// TODO: implement devtools channel switcher.
let isBetaTools = false;

function performInstallUpgrade(aData, aReason) {
  let page;

  if (aReason == ADDON_INSTALL) {
    page = DEVTOOLS_POST_INSTALL_PAGE;
  } else if (aReason == ADDON_UPGRADE) {
    page = DEVTOOLS_POST_UPGRADE_PAGE;
  } else {
    return; // nothing to do
  }

  // Install the Developer Tools from AMO.
  for (let tool in DEVTOOLS_ADDONS) {
    AddonManager.getInstallForURL(DEVTOOLS_ADDONS[tool].url,
      function(aInstall) {
        // TODO: need to skip extensions the user explicitly disabled/removed.
        aInstall.install();
      }, MIME_XPI);
  }

  if (gBrowser) {
    gBrowser.selectedTab = gBrowser.addTab(page);
  }
}

function performSwitchDevTools() {
  // FIXME
  dump("performSwitchDevTools \n");
}


function startup(aData, aReason) {
  performInstallUpgrade(aData, aReason);

  // TODO: we need a window observer that changes the menu each time a new
  // window is open. Yay!
  let document = recentWindow.document;

  let cmdInstall = document.getElementById("Tools:InstallDevTools");
  let cmdSwitch = document.createElementNS(NS_XUL, "command");
  let appMenuInstall = document.getElementById("appmenu_installDevTools");
  let appMenuSwitch = document.createElementNS(NS_XUL, "menuitem");
  let toolsMenuInstall = document.getElementById("menu_installDevTools");
  let toolsMenuSwitch = document.createElementNS(NS_XUL, "menuitem");

  cmdInstall.setAttribute("disabled", "true");
  appMenuInstall.setAttribute("hidden", "true");
  toolsMenuInstall.setAttribute("hidden", "true");

  cmdSwitch.setAttribute("id", "Tools:SwitchDevTools");
  appMenuSwitch.setAttribute("id", "appmenu_switchDevTools");
  appMenuSwitch.setAttribute("command", "Tools:SwitchDevTools");
  toolsMenuSwitch.setAttribute("command", "Tools:SwitchDevTools");
  toolsMenuSwitch.setAttribute("id", "menu_switchDevTools");

  let appMenuLabel = appMenuInstall.getAttribute("labelToBeta");
  appMenuSwitch.setAttribute("label", appMenuLabel);

  let toolsMenuLabel = toolsMenuInstall.getAttribute("labelToBeta");
  toolsMenuSwitch.setAttribute("label", toolsMenuLabel);

  let appMenuPopup = appMenuInstall.parentNode;
  appMenuPopup.insertBefore(appMenuSwitch, appMenuInstall.nextSibling);

  let toolsMenuPopup = toolsMenuInstall.parentNode;
  toolsMenuPopup.insertBefore(toolsMenuSwitch, toolsMenuInstall.nextSibling);

  let commands = cmdInstall.parentNode;
  cmdSwitch.addEventListener("command", performSwitchDevTools, false);
  commands.appendChild(cmdSwitch);
}

function shutdown(aData, aReason) {
  let document = recentWindow.document;

  let cmdInstall = document.getElementById("Tools:InstallDevTools");
  let cmdSwitch = document.getElementById("Tools:SwitchDevTools");
  let appMenuInstall = document.getElementById("appmenu_installDevTools");
  let appMenuSwitch = document.getElementById("appmenu_switchDevTools");
  let toolsMenuInstall = document.getElementById("menu_installDevTools");
  let toolsMenuSwitch = document.getElementById("menu_switchDevTools");

  cmdInstall.removeAttribute("disabled");
  appMenuInstall.removeAttribute("hidden");
  toolsMenuInstall.removeAttribute("hidden");

  let appMenuPopup = appMenuSwitch.parentNode;
  appMenuPopup.removeChild(appMenuSwitch);

  let toolsMenuPopup = toolsMenuSwitch.parentNode;
  toolsMenuPopup.removeChild(toolsMenuSwitch);

  let commands = cmdSwitch.parentNode;
  commands.removeChild(cmdSwitch);
}

function uninstall(aData, aReason) {
  if (aReason != APP_UNINSTALL) {
    return;
  }

  // Uninstall the Developer Tools.
  for (let tool in DEVTOOLS_ADDONS) {
    AddonManager.getAddonByID(DEVTOOLS_ADDONS[tool].id,
      function(aAddon) {
        if (aAddon.uninstall) {
          aAddon.uninstall();
        }
      });
  }
}

