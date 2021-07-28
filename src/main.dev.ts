/* eslint global-require: off, no-console: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `yarn build` or `yarn build:main`, this file is compiled to
 * `./src/main.prod.js` using webpack. This gives us some performance wins.
 */
import 'core-js/stable';
import 'regenerator-runtime/runtime';
import path from 'path';
import { watchFile, unwatchFile, readFileSync, writeFileSync } from 'fs';
import { app, BrowserWindow, ipcMain } from 'electron';
import mjml2html from 'mjml';
// import MenuBuilder from './menu';
import { IPCEvent } from './ipc/events';

//parta minificar el html generado por MJML.
import minify from '@node-minify/core';
import htmlMinifier from '@node-minify/html-minifier';

/**
 *
 * INICIO DE BOOTRAP
 * Este bloque de codigo viene de
 * https://github.com/electron-react-boilerplate/
 *
 */

let mainWindow: BrowserWindow | null = null;

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

if (
  process.env.NODE_ENV === 'development' ||
  process.env.DEBUG_PROD === 'true'
) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload
    )
    .catch(console.log);
};

const createWindow = async () => {
  if (
    process.env.NODE_ENV === 'development' ||
    process.env.DEBUG_PROD === 'true'
  ) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    show: false,
    width: 960,
    height: 720,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      nodeIntegration: true,
    },
  });

  mainWindow.loadURL(`file://${__dirname}/index.html`);

  // @TODO: Use 'ready-to-show' event
  //        https://github.com/electron/electron/blob/master/docs/api/browser-window.md#using-ready-to-show-event
  mainWindow.webContents.on('did-finish-load', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
      mainWindow.focus();
      // mainWindow.maximize();
      /** Oculto DeveloperTools en modo DEV */
      mainWindow.webContents.closeDevTools();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // const menuBuilder = new MenuBuilder(mainWindow);
  // menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.on('new-window', (event, url) => {
    event.preventDefault();
    // comento esta linea para evitar que se sigan los links
    // shell.openExternal(url);
  });
};

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.whenReady().then(createWindow).catch(console.log);

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) createWindow();
});

/**
 *
 * FIN DE BOOTRAP|
 *
 * A partir de aca comienza el codigo propio de la app TemplateManager
 *
 */

let watcherJson = '';
let watcherHtml = '';

const getJSONData = (filePath: string) => {
  const DATA = readFileSync(filePath);
  mainWindow?.webContents.send(IPCEvent.JSON_UPDATE, JSON.parse(DATA));
};

const getHTMLData = (filePath: string) => {
  const open_tag = ['{{', '<!-- X'];
  const close_tag = ['}}', 'X -->'];

  const DATA = readFileSync(filePath);

  const fileExtension = filePath.substr(filePath.lastIndexOf('.') + 1);

  if (fileExtension === 'mjml') {
    // TODO: Cambiar {{ y }} por <!--X y X-->
    // Y luego volver a cambiarlos
    const data = DATA.toString()
      .replaceAll(open_tag[0], open_tag[1])
      .replaceAll(close_tag[0], close_tag[1]);

    const mjml = mjml2html(data);

    const html = mjml.html.replaceAll(open_tag[1], open_tag[0]).replaceAll(close_tag[1], close_tag[0]);

    mainWindow?.webContents.send(IPCEvent.HTML_UPDATE, html);

    const renderedHtmlTemplate = filePath.replaceAll('.mjml','.template.html');

    writeFileSync(renderedHtmlTemplate, html);
    console.log(`Template generado en ${renderedHtmlTemplate}`);

  } else if (fileExtension === 'html') {
    mainWindow?.webContents.send(IPCEvent.HTML_UPDATE, DATA.toString());
  } else {
    mainWindow?.webContents.send(IPCEvent.HTML_UPDATE, '');
  }
};

ipcMain.on(IPCEvent.JSON_FILE, async (event, json_path) => {
  if (json_path.length) {
    if (watcherJson !== '') {
      await unwatchFile(watcherJson);
    }

    watcherJson = json_path;

    getJSONData(json_path);

    watchFile(json_path, () => {
      getJSONData(json_path);
    });
  }
});

ipcMain.on(IPCEvent.HTML_FILE, async (event, html_path) => {
  if (html_path.length) {
    if (watcherHtml !== '') {
      await unwatchFile(watcherHtml);
    }

    watcherHtml = html_path;

    getHTMLData(html_path);

    watchFile(html_path, () => {
      getHTMLData(html_path);
    });
  }
});
