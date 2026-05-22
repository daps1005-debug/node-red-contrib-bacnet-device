module.exports = function (RED) {

    const Bacnet = require('bacstack');

    // =========================
    // COLA GLOBAL
    // =========================
    const globalRequestQueue = [];

    let isGlobalProcessing = false;

    const MAX_QUEUE = 1000;

    class BacnetDeviceNode {

        constructor(config) {

            RED.nodes.createNode(this, config);

            this.ip = config.ip;

            // LISTA DE PUNTOS
            this.points = config.points || [];

            this.on(
                'input',
                this.handleInput.bind(this)
            );

            this.on(
                'close',
                this.handleClose.bind(this)
            );
        }

        // =========================
        // INPUT
        // =========================
        handleInput(msg) {

            // PROTEGER COLA
            if (
                globalRequestQueue.length >= MAX_QUEUE
            ) {

                this.warn(
                    "BACnet queue full"
                );

                return;
            }

            // CLONAR MENSAJE
            const clonedMsg =
                RED.util.cloneMessage(msg);

            // AGREGAR A COLA
            globalRequestQueue.push({

                node: this,

                msg: clonedMsg
            });

            // INICIAR PROCESAMIENTO
            if (!isGlobalProcessing) {

                this.processGlobalQueue();
            }
        }

        // =========================
        // PROCESAMIENTO GLOBAL
        // =========================
        async processGlobalQueue() {

            if (
                isGlobalProcessing ||
                globalRequestQueue.length === 0
            ) {
                return;
            }

            isGlobalProcessing = true;

            while (
                globalRequestQueue.length > 0
            ) {

                const {
                    node,
                    msg
                } = globalRequestQueue.shift();

                // CLIENTE TEMPORAL
                const client = new Bacnet({

                    timeout: 5000
                });

                try {

                    const result = {};

                    let successCount = 0;

                    // =========================
                    // LEER TODOS LOS PUNTOS
                    // =========================
                    for (const point of node.points) {

                        try {

                            const value =
                                await node.readProperty(
                                    client,
                                    point
                                );

                            result[
                                point.name
                            ] = value;

                            successCount++;

                            // DELAY PEQUEÑO
                            await node.delay(50);

                        } catch (err) {

                            result[
                                point.name
                            ] = null;

                            node.warn(
                                `${point.name}: ${err.message}`
                            );
                        }
                    }

                    // =========================
                    // ENVIAR RESULTADO
                    // =========================
                    msg.payload = result;

                    msg.device = node.ip;

                    msg.timestamp =
                        Date.now();

                    node.send(msg);

                    // =========================
                    // STATUS
                    // =========================
                    node.status({

                        fill: "green",

                        shape: "dot",

                        text:
                            `${successCount}/${node.points.length} points`
                    });

                } catch (err) {

                    node.error(

                        `BACnet Error: ${err.message}`,

                        msg
                    );

                    node.status({

                        fill: "red",

                        shape: "ring",

                        text: err.message
                    });

                } finally {

                    // CERRAR CLIENTE
                    client.close();
                }

                // DELAY ENTRE REQUESTS
                await this.delay(100);
            }

            isGlobalProcessing = false;
        }

        // =========================
        // LEER PROPIEDAD
        // =========================
        readProperty(client, point) {

            return new Promise(

                (resolve, reject) => {

                    client.readProperty(

                        this.ip,

                        {
                            type: point.type,

                            instance:
                                point.instance
                        },

                        point.property || 85,

                        (err, value) => {

                            if (err) {

                                return reject(err);
                            }

                            resolve(

                                value.values?.[0]?.value ?? null
                            );
                        }
                    );
                }
            );
        }

        // =========================
        // DELAY
        // =========================
        delay(ms) {

            return new Promise(

                resolve =>
                    setTimeout(resolve, ms)
            );
        }

        // =========================
        // CLOSE
        // =========================
        handleClose(done) {

            done();
        }
    }

    // =========================
    // REGISTER NODE
    // =========================
    RED.nodes.registerType(

        'bacnet-device',

        BacnetDeviceNode
    );
};