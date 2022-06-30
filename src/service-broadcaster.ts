import dgram from "dgram";
import { UDP_PORT } from "./env";

import { IPCMessage, Service } from "./types";
import { getFirstLocalInterfaceAddress } from "./util";

const localIp = getFirstLocalInterfaceAddress();
const services = new Map<string, Service>();

// Recieve services to be advertised from the parent process
// NOTE: We may want to also support this as an UDP broadcast message 
// so other services can advertise themselves

process.on("message", (message: IPCMessage) => {
  console.log("message received from main process", message.type);
  if (message.type == "advertise-service") {
    if (message.service) {
      const service = message.service;
      if (service.type === "local") {
        service.ip = localIp;
      }
      if (!services.has(service.name)) {
        console.log(`New ${service.type} advertised service: ${service.name}:${service.ip ?? ''}:${service.port}`);
      } else {
        console.log(`Updating ${service.type} advertised service: ${service.name}:${service.ip ?? ''}:${service.port}`);
      }
      services.set(service.name, service);

      console.log(`Currently advertising ${services.size} services`, );
    }
  }
});

const server = dgram.createSocket("udp4");

server.bind(UDP_PORT);

server.on("message", (data, rinfo) => {
  if (data.length === 0) return;
  function remoteAddress(rinfo: dgram.RemoteInfo) {
    return `${rinfo.address}:${rinfo.port}`;
  }
  const message = data.toString("utf-8");
  if (!services.has(message)) {
    console.log(
      `Unsupported service asked from ${remoteAddress(
        rinfo
      )}. Asked: "${message}"`
    );
    return;
  }

  const service = services.get(message);
  if (service) {
    const ip = service.type === 'local' ? service.ip ?? localIp : service.ip;
    const response = JSON.stringify({ ip, port: service.port });
    console.log(
      `"${remoteAddress(
        rinfo
      )}" asked for ${message}. replying with ${response}`
    );
    server.send(response, rinfo.port, rinfo.address);
  } else {
    console.error(
      `Service Port Unavailable: Could not respond to ${remoteAddress(rinfo)}`
    );
  }
});

server.on("listening", () => {
  const address = server.address();
  console.log(`UDP Server listening on ${address.address}:${address.port}`);
});

server.on("error", (err) => {
  console.log(`UDP Server error: ${err.message}`);
});

server.on("close", () => {
  console.log("UDP Server closed");
});
