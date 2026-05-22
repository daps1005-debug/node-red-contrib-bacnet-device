# node-red-contrib-bacnet-device

BACnet Device polling node for Node-RED using bacstack.

## Features

- Read multiple BACnet points
- BACnet/IP support
- Queue-based polling
- Async processing
- Industrial automation ready
- HVAC / SCADA integration

---

## Installation

```bash
npm install node-red-contrib-bacnet-device
```

---

## Configuration

### Device Parameters

| Field | Description |
|---|---|
| Name | Optional node name |
| IP | BACnet device IP address |
| Points | BACnet objects to read |

---

## Point Configuration

Each point requires:

| Field | Description |
|---|---|
| Name | Output property name |
| Type | BACnet object type |
| Instance | BACnet object instance |
| Property | BACnet property id |

Default property:
```text
85 = Present Value
```

---

## Example

### Input

Inject node trigger.

### Output

```json
{
  "payload": {
    "RoomTemp": 23.5,
    "Humidity": 45,
    "FanStatus": 1
  },
  "device": "192.168.1.100",
  "timestamp": 1747880000000
}
```

---

## Example BACnet Objects

| Object | Type |
|---|---|
| Analog Input | 0 |
| Analog Output | 1 |
| Analog Value | 2 |
| Binary Input | 3 |
| Binary Output | 4 |
| Binary Value | 5 |

---

## Dependencies

- bacstack

---

## Use Cases

- HVAC monitoring
- Smart buildings
- Hotel automation
- Industrial SCADA
- BACnet/IP integrations

---

## License

MIT