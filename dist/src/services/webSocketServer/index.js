"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = __importDefault(require("events"));
const url_1 = __importDefault(require("url"));
const ws_1 = __importDefault(require("ws"));
const enums_1 = require("../../enums");
const client_1 = require("../../models/client");
const utils_1 = require("../../utils");
const Logger_1 = __importDefault(require("../../Logger"));
const Redis = require("ioredis");
const WS_PATH = "peerjs";
class WebSocketServer extends events_1.default {
    constructor({ server, realm, config, }) {
        super();
        this.setMaxListeners(0);
        this.realm = realm;
        this.config = config;
        const path = this.config.path;
        this.path = `${path}${path.endsWith("/") ? "" : "/"}${WS_PATH}`;
        this.logger = new Logger_1.default(this.config.redisHost, this.config.redisPort);
        this.socketServer = new ws_1.default.Server({ path: this.path, server });
        this.socketServer.on("connection", (socket, req) => this._onSocketConnection(socket, req));
        this.socketServer.on("error", (error) => this._onSocketError(error));
        if (config.redis) {
            this.messagePublisher = new Redis(this.config.redisPort, this.config.redisHost);
            this.messageSubscriber = new Redis(this.config.redisPort, this.config.redisHost);
            this._configureRedis();
        }
    }
    _configureRedis() {
        this.messageSubscriber.subscribe("transmission", (err) => {
            if (!err)
                console.log("Subscribed to Transmission messages");
        });
        this.messageSubscriber.on("message", (channel, tmessage) => {
            utils_1.clog("redis.messageSubscriber-start: " + (new Date()).toISOString());
            utils_1.clog(`Received Message on Channel:: ${channel}`);
            if (channel === "transmission") {
                const receivedMessage = JSON.parse(tmessage);
                if (receivedMessage.dst &&
                    this.realm.getClientById(receivedMessage.dst)) {
                    this.logger.logById(receivedMessage.dst, `MessageReceived::${receivedMessage.type} for Destination::${receivedMessage.dst} from Source::${receivedMessage.src}`);
                    this.emit("message", undefined, receivedMessage);
                }
            }
            utils_1.clog("redis.messageSubscriber-end: " + (new Date()).toISOString());
        });
    }
    _onSocketConnection(socket, req) {
        const { query = {} } = url_1.default.parse(req.url, true);
        const { id, token, key } = query;
        if (!id || !token || !key) {
            return this._sendErrorAndClose(socket, enums_1.Errors.INVALID_WS_PARAMETERS);
        }
        if (key !== this.config.key) {
            return this._sendErrorAndClose(socket, enums_1.Errors.INVALID_KEY);
        }
        const client = this.realm.getClientById(id);
        if (client) {
            if (token !== client.getToken()) {
                // ID-taken, invalid token
                this.logger.logById(id, "Invalid Token.Closing Connection");
                socket.send(JSON.stringify({
                    type: enums_1.MessageType.ID_TAKEN,
                    payload: { msg: "ID is taken" },
                }));
                return socket.close();
            }
            return this._configureWS(socket, client);
        }
        this._registerClient({ socket, id, token });
    }
    _onSocketError(error) {
        // handle error
        this.emit("error", error);
    }
    _registerClient({ socket, id, token, }) {
        utils_1.clog("index._registerClient-start: " + (new Date()).toISOString());
        // Check concurrent limit
        const clientsCount = this.realm.getClientsIds().length;
        if (clientsCount >= this.config.concurrent_limit) {
            return this._sendErrorAndClose(socket, enums_1.Errors.CONNECTION_LIMIT_EXCEED);
        }
        console.log("NEW CLIENT:::", id);
        this.logger.logById(id, `Client Connected ${id}`);
        const newClient = new client_1.Client({ id, token });
        this.realm.setClient(newClient, id);
        socket.send(JSON.stringify({ type: enums_1.MessageType.OPEN }));
        this._configureWS(socket, newClient);
        utils_1.clog("index._registerClient-end: " + (new Date()).toISOString());
    }
    _configureWS(socket, client) {
        client.setSocket(socket);
        // Cleanup after a socket closes.
        socket.on("close", () => {
            utils_1.clog("_configureWS.close-start: " + (new Date()).toISOString());
            if (client.getSocket() === socket) {
                this.logger.logById(client.getId(), `Connection closed.Cleaning up meeting`);
                this.realm.removeClientById(client.getId());
                this.emit("close", client);
            }
            utils_1.clog("_configureWS.close-end: " + (new Date()).toISOString());
        });
        // Handle messages from peers.
        socket.on("message", (data) => {
            try {
                //clog("Socket on-message: " + (new Date()).toISOString());
                const message = JSON.parse(data);
                message.src = client.getId();
                if (message.type !== "HEARTBEAT" && this.config.redis) {
                    this.messagePublisher.publish("transmission", JSON.stringify(message));
                    return;
                }
                this.emit("message", client, message);
            }
            catch (e) {
                this.logger.logById(client.getId(), `Error in connection`);
                this.emit("error", e);
            }
        });
        this.emit("connection", client);
    }
    _sendErrorAndClose(socket, msg) {
        socket.send(JSON.stringify({
            type: enums_1.MessageType.ERROR,
            payload: { msg },
        }));
        socket.close();
    }
}
exports.WebSocketServer = WebSocketServer;
