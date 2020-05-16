"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const v4_1 = __importDefault(require("uuid/v4"));
const client_1 = require("./client");
const messageQueue_1 = require("./messageQueue");
const utils_1 = require("../utils");
const Redis = require("ioredis");
const os = require("os");
const redisHost = process.env.NODE_ENV === "development"
    ? "127.0.0.1"
    : "fmqueue.7piuva.ng.0001.use1.cache.amazonaws.com";
const redisPort = 6379;
// const redisPub = new Redis();
const redisSub = new Redis(redisPort, redisHost);
const redisPub = new Redis(redisPort, redisHost);
class Realm {
    constructor() {
        this.clients = new Map();
        this.messageQueues = new Map();
        redisSub.subscribe("clients", (err) => {
            if (!err)
                utils_1.clog("Subscribed to Clients");
        });
        redisSub.on("message", (channel, message) => {
            if (channel === "clients") {
                const { client = null, id = null, host = null, action = null, } = JSON.parse(message);
                if (host == os.hostname()) {
                    utils_1.clog("Same Host -------> Return");
                    return;
                }
                const { token, lastPing } = client;
                if (action === "set") {
                    const newClient = new client_1.Client({ id, token });
                    newClient.setLastPing(lastPing);
                    this.clients.set(id, newClient);
                }
                if (action === "delete") {
                    const client = this.getClientById(id);
                    if (!client)
                        return false;
                    this.clients.delete(id);
                }
            }
        });
    }
    getClientsIds() {
        return [...this.clients.keys()];
    }
    getClientById(clientId) {
        return this.clients.get(clientId);
    }
    getClientsIdsWithQueue() {
        return [...this.messageQueues.keys()];
    }
    setClient(client, id) {
        this.clients.set(id, client);
        redisPub.publish("clients", JSON.stringify({
            client,
            id,
            host: os.hostname(),
            action: "set",
        }));
    }
    removeClientById(id) {
        const client = this.getClientById(id);
        if (!client)
            return false;
        this.clients.delete(id);
        redisPub.publish("clients", JSON.stringify({
            id,
            host: os.hostname(),
            action: "delete",
        }));
        return true;
    }
    getMessageQueueById(id) {
        console.log("Getting MessageQueue");
        return this.messageQueues.get(id);
    }
    addMessageToQueue(id, message) {
        console.log("Add MessageQueue");
        if (!this.getMessageQueueById(id)) {
            this.messageQueues.set(id, new messageQueue_1.MessageQueue());
        }
        this.getMessageQueueById(id).addMessage(message);
    }
    clearMessageQueue(id) {
        this.messageQueues.delete(id);
    }
    generateClientId(generateClientId) {
        const generateId = generateClientId ? generateClientId : v4_1.default;
        let clientId = generateId();
        while (this.getClientById(clientId)) {
            clientId = generateId();
        }
        console.log("Generate ID", clientId);
        return clientId;
    }
}
exports.Realm = Realm;
