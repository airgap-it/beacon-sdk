"use strict";
exports.__esModule = true;
var fs_1 = require("fs");
var replaceInFile = function (file, src, dest) {
    var content = fs_1.readFileSync(file, 'utf-8');
    var newContent = content.split(src).join(dest);
    fs_1.writeFileSync(file, newContent);
};
replaceInFile('./dist/client/storage/FileStorage.js', 'const fs_1 = require("fs");', '// const fs_1 = require("fs");');
replaceInFile('./dist/client/clients/Client.d.ts', 'get isConnected(): Promise<boolean>;', 'readonly isConnected: Promise<boolean>;');
replaceInFile('./dist/client/transports/Transport.d.ts', 'get connectionStatus(): TransportStatus;', 'readonly connectionStatus: TransportStatus;');
