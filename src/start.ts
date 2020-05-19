import { PeerServer } from "./index";

PeerServer({
  port: 9000,
  expire_timeout: 5000,
  alive_timeout: 60000,
  key: "peerjs",
  path: "/myapp",
  concurrent_limit: 5000,
  allow_discovery: false,
  proxied: false,
  cleanup_out_msgs: 1000,
  redis: true,
  redisHost: "127.0.0.1",
  redisPort: 6379,
});
