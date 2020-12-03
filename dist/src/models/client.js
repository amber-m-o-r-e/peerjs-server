"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../utils");
class Client {
    constructor({ id, token }) {
        this.socket = null;
        this.lastPing = new Date().getTime();
        console.log("Create a client");
        utils_1.clog("Create a client: " + (new Date()).toISOString());
        this.id = id;
        this.token = token;
    }
    getId() {
        return this.id;
    }
    getToken() {
        return this.token;
    }
    getSocket() {
        return this.socket;
    }
    setSocket(socket) {
        this.socket = socket;
    }
    getLastPing() {
        return this.lastPing;
    }
    setLastPing(lastPing) {
        this.lastPing = lastPing;
    }
    send(data) {
        var _a;
        (_a = this.socket) === null || _a === void 0 ? void 0 : _a.send(JSON.stringify(data));
    }
}
exports.Client = Client;
