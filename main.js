'use strict';

var app = require('app');
var BrowserWindow = require('browser-window');

var mainWindow = null;

app.on('ready', function() {
    mainWindow = new BrowserWindow({
        // frame: false,
        'auto-hide-menu-bar': true,
        'use-content-size': true,
        height: 768,
        width: 1260
    });

    mainWindow.loadUrl('file://' + __dirname + '/app/index.html');
    mainWindow.focus();
});

var ipc = require('ipc');

ipc.on('close-main-window', function () {
    app.quit();
});

// Quit when all windows are closed.
app.on('window-all-closed', function() {
  app.quit();
});

