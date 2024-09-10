var __importDefault =
  (this && this.__importDefault) ||
  ((mod) => (mod && mod.__esModule ? mod : { default: mod }));
Object.defineProperty(exports, '__esModule', { value: true });
exports.Impl = void 0;
const rosmsg_1 = require('@foxglove/rosmsg');
const rosmsg_serialization_1 = require('@foxglove/rosmsg-serialization');
const rosmsg2_serialization_1 = require('@foxglove/rosmsg2-serialization');
const ws_protocol_1 = require('@foxglove/ws-protocol');
const eventemitter3_1 = __importDefault(require('eventemitter3'));
const isomorphic_ws_1 = __importDefault(require('isomorphic-ws'));
class Impl {
  emitter = new eventemitter3_1.default();
  #client;
  #connecting;
  #isRos1;
  // Message Readers / Writers
  #messageReaders = new Map();
  #messageWriters = new Map();
  // Channels
  #channelsById = new Map();
  #channelsByName = new Map();
  // Services
  #servicesById = new Map();
  #servicesByName = new Map();
  #publisherIdsWithCount = new Map();
  #subscriptionIdsWithCount = new Map();
  #callId = 0;
  #paramId = 0;
  constructor(url) {
    this.#client = new ws_protocol_1.FoxgloveClient({
      ws: new isomorphic_ws_1.default(url, [
        ws_protocol_1.FoxgloveClient.SUPPORTED_SUBPROTOCOL,
      ]),
    });
    const open = new Promise((resolve) => {
      this.#client.on('open', resolve);
    });
    const serverInfo = new Promise((resolve) => {
      this.#client.on('serverInfo', (event) => {
        this.#isRos1 = event.supportedEncodings?.includes('ros1') ?? false;
        resolve();
      });
    });
    this.#client.on('close', (event) => {
      this.emitter.emit('close', event);
    });
    this.#client.on('error', (error) => {
      this.emitter.emit('error', error ?? new Error('WebSocket error'));
    });
    this.#client.on('advertise', (channels) => {
      for (const channel of channels) {
        this.#channelsById.set(channel.id, channel);
        this.#channelsByName.set(channel.topic, channel);
      }
    });
    this.#client.on('unadvertise', (channelIds) => {
      for (const channelId of channelIds) {
        const channel = this.#channelsById.get(channelId);
        if (channel) {
          this.#channelsById.delete(channel.id);
          this.#channelsByName.delete(channel.topic);
        }
      }
    });
    this.#client.on('advertiseServices', (services) => {
      for (const service of services) {
        this.#servicesById.set(service.id, service);
        this.#servicesByName.set(service.name, service);
      }
    });
    this.#client.on('unadvertiseServices', (serviceIds) => {
      for (const serviceId of serviceIds) {
        const service = this.#servicesById.get(serviceId);
        if (service) {
          this.#servicesById.delete(service.id);
          this.#servicesByName.delete(service.name);
        }
      }
    });
    this.#connecting = new Promise((resolve) => {
      Promise.all([open, serverInfo]).then(() => {
        this.emitter.emit('connection');
        resolve();
      });
    });
  }
  close() {
    this.#client.close();
  }
  getTopics() {
    return {
      topics: [...this.#channelsByName.keys()],
      types: [...this.#channelsByName.values()].map((x) => x.schemaName),
    };
  }
  getServices() {
    return new Promise((resolve) => {
      const listener = (event) => {
        this.#client.off('connectionGraphUpdate', listener);
        this.#client.unsubscribeConnectionGraph();
        resolve(event.advertisedServices.map((service) => service.name));
      };
      this.#client.on('connectionGraphUpdate', listener);
      this.#client.subscribeConnectionGraph();
    });
  }
  getTopicType(topic) {
    return this.#channelsByName.get(topic)?.schemaName;
  }
  getServiceType(service) {
    return this.#servicesByName.get(service)?.type;
  }
  async createPublisher(name, messageType) {
    await this.#connecting;
    const channel = this.#getChannel(name);
    const publisherId = (() => {
      const idWithCount = this.#publisherIdsWithCount.get(name);
      if (idWithCount) {
        idWithCount.count++;
        return idWithCount.id;
      }
      const publisherId = this.#client.advertise({
        topic: name,
        encoding: this.#isRos1 ? 'ros1' : 'cdr',
        schemaName: messageType,
      });
      this.#publisherIdsWithCount.set(name, { id: publisherId, count: 1 });
      return publisherId;
    })();
    const writer = this.#getMessageWriter(await channel);
    return {
      publish: (message) => {
        this.#client.sendMessage(publisherId, writer.writeMessage(message));
      },
      unadvertise: () => {
        const idWithCount = this.#publisherIdsWithCount.get(name);
        if (idWithCount) {
          idWithCount.count--;
          if (idWithCount.count === 0) {
            this.#publisherIdsWithCount.delete(name);
            this.#client.unadvertise(publisherId);
          }
        }
      },
    };
  }
  async createSubscription(name, callback) {
    await this.#connecting;
    const channel = await this.#getChannel(name);
    const subscriptionId = (() => {
      const idWithCount = this.#subscriptionIdsWithCount.get(name);
      if (idWithCount) {
        idWithCount.count++;
        return idWithCount.id;
      }
      const subscriptionId = this.#client.subscribe(channel.id);
      this.#subscriptionIdsWithCount.set(name, {
        id: subscriptionId,
        count: 1,
      });
      return subscriptionId;
    })();
    const reader = this.#getMessageReader(channel);
    const listener = (event) => {
      if (event.subscriptionId === subscriptionId) {
        callback(reader.readMessage(event.data));
      }
    };
    this.#client.on('message', listener);
    return {
      unsubscribe: () => {
        this.#client.off('message', listener);
        const idWithCount = this.#subscriptionIdsWithCount.get(name);
        if (idWithCount) {
          idWithCount.count--;
          if (idWithCount.count === 0) {
            this.#subscriptionIdsWithCount.delete(name);
            this.#client.unsubscribe(subscriptionId);
          }
        }
      },
    };
  }
  async sendServiceRequest(name, request) {
    await this.#connecting;
    const service = await this.#getService(name);
    const writer = this.#getMessageWriter(service);
    const reader = this.#getMessageReader(service);
    const callId = this.#callId++;
    return new Promise((resolve) => {
      const listener = (event) => {
        if (event.serviceId === service.id && event.callId === callId) {
          this.#client.off('serviceCallResponse', listener);
          resolve(reader.readMessage(event.data));
        }
      };
      this.#client.on('serviceCallResponse', listener);
      this.#client.sendServiceCallRequest({
        serviceId: service.id,
        callId,
        encoding: this.#isRos1 ? 'ros1' : 'cdr',
        data: new DataView(writer.writeMessage(request).buffer),
      });
    });
  }
  async getParameter(name) {
    await this.#connecting;
    const paramId = (this.#paramId++).toString();
    return new Promise((resolve) => {
      const listener = (event) => {
        if (event.parameters[0]?.name === name && event.id === paramId) {
          this.#client.off('parameterValues', listener);
          resolve(event.parameters[0].value);
        }
      };
      this.#client.on('parameterValues', listener);
      this.#client.getParameters([name], paramId);
    });
  }
  async setParameter(name, value, type) {
    await this.#connecting;
    const paramId = (this.#paramId++).toString();
    return new Promise((resolve) => {
      const listener = (event) => {
        if (event.parameters[0]?.name === name && event.id === paramId) {
          this.#client.off('parameterValues', listener);
          resolve(event.parameters[0]);
        }
      };
      this.#client.on('parameterValues', listener);
      this.#client.setParameters([{ name: name, value, type }], paramId);
    });
  }
  async #getChannel(name) {
    await this.#connecting;
    return (
      this.#channelsByName.get(name) ??
      (await new Promise((resolve) => {
        const listener = (channels) => {
          const channel = channels.find((channel) => channel.topic === name);
          if (channel) {
            this.#client.off('advertise', listener);
            resolve(channel);
          }
        };
        this.#client.on('advertise', listener);
      }))
    );
  }
  async #getService(name) {
    await this.#connecting;
    return (
      this.#servicesByName.get(name) ??
      (await new Promise((resolve) => {
        const listener = (services) => {
          const service = services.find((channel) => channel.name === name);
          if (service) {
            this.#client.off('advertiseServices', listener);
            resolve(service);
          }
        };
        this.#client.on('advertiseServices', listener);
      }))
    );
  }
  #getMessageReader(channelOrService) {
    const name =
      'schemaName' in channelOrService
        ? channelOrService.schemaName
        : channelOrService.type;
    const schemaEncoding =
      'schemaEncoding' in channelOrService
        ? channelOrService.schemaEncoding
        : undefined;
    const schema =
      'schema' in channelOrService
        ? channelOrService.schema
        : channelOrService.responseSchema;
    return (
      this.#messageReaders.get(name) ??
      (() => {
        const reader = this.#isRos1
          ? new rosmsg_serialization_1.MessageReader(
              (0, rosmsg_1.parse)(schema, { ros2: false }),
            )
          : new rosmsg2_serialization_1.MessageReader(
              schemaEncoding === 'ros2idl'
                ? (0, rosmsg_1.parseRos2idl)(schema)
                : (0, rosmsg_1.parse)(schema, { ros2: true }),
            );
        this.#messageReaders.set(name, reader);
        return reader;
      })()
    );
  }
  #getMessageWriter(channelOrService) {
    const name =
      'schemaName' in channelOrService
        ? channelOrService.schemaName
        : channelOrService.type;
    const schemaEncoding =
      'schemaEncoding' in channelOrService
        ? channelOrService.schemaEncoding
        : undefined;
    const schema =
      'schema' in channelOrService
        ? channelOrService.schema
        : channelOrService.requestSchema;
    return (
      this.#messageWriters.get(name) ??
      (() => {
        const writer = this.#isRos1
          ? new rosmsg_serialization_1.MessageWriter(
              (0, rosmsg_1.parse)(schema, { ros2: false }),
            )
          : new rosmsg2_serialization_1.MessageWriter(
              schemaEncoding === 'ros2idl'
                ? (0, rosmsg_1.parseRos2idl)(schema)
                : (0, rosmsg_1.parse)(schema, { ros2: true }),
            );
        this.#messageWriters.set(name, writer);
        return writer;
      })()
    );
  }
}
exports.Impl = Impl;
//# sourceMappingURL=Impl.js.map
