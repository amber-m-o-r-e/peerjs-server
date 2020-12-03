"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const utils_1 = require("../../../utils");
exports.default = ({ realm, messageHandler, }) => {
    const app = express_1.default.Router();
    const handle = (req, res, next) => {
        utils_1.clog("Handle getting executed: " + (new Date()).toISOString());
        const { id } = req.params;
        console.log("Got request...");
        if (!id)
            return next();
        const client = realm.getClientById(id);
        if (!client) {
            throw new Error(`client not found:${id}`);
        }
        const { type, dst, payload } = req.body;
        const message = {
            type,
            src: id,
            dst,
            payload,
        };
        messageHandler.handle(client, message);
        utils_1.clog("Handle executed: " + (new Date()).toISOString());
        res.sendStatus(200);
    };
    app.post("/offer", handle);
    app.post("/candidate", handle);
    app.post("/answer", handle);
    app.post("/leave", handle);
    return app;
};
