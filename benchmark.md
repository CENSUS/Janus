# Benchmarks

Instructions on how to run Benchmarks

---

# Installation instructions

The Benchmarking Tool can be found under:

> Janus/various/measurements

**To install the tool**, while inside the _measurements_ folder execute:

```bash
npm install
```

**To execute the tool**, while inside the _measurements_ folder execute:

```
node run.js
```

By running the command found above, a selection menu will appear, prompting you to choose the way that you want to run the benchmarks.
The options are two:

- **Automatically**: Meaning that the tool will automatically run the benchmark, based on predefined options. You may change the benchmark's options (i.e. clients, request ids, invocations), by editing the users' settings file that can be found at:

  > Janus/various/measurements/config/users.json

- **Manually**: Meaning that you will have to choose the options (clients, request ids, invocations) that the tool will use.

---

## How to edit the requests

While you can manually choose which request id to send along with every request sent by the tool, the encapsulated data of every request id is **predefined**.
You can redefine the data sent with each request id, by editing the file that can be found at:

> Janus/various/measurements/requests.json

---

## How to view the benchmark's results

You can view the benchmark's results at: _https://api.`PUBLIC_IP`.nip.io/benchmarks_

## How to create create multiple benchmarks?

The System will automatically close a Benchmark Session if there are no other active requests.
For example, suppose that you send 1.000 concurrent requests to the System, by using the Benchmarking Tool.

Upon successful completion of all the 1.000 requests, the System will stop the (currently) running session and will start a new Benchmarking Session with the next batch of requests.

## How to deactivate the Benchmarking Capabilities?

In order to deactivate the Benchmarking Capabilities of the System, you should modify the configuration of the *Backend API*.

The configuration can be found at:

> Janus/blockchain/blockchain_apis/backend/config/main_config.js

*main_config.js* includes:

`metrics: { metricsOn: true, cliLog: false, pageLog: true }`

- *metricsOn*: Activates/Deactivates the Benchmarking Capabilities of the System
- *cliLog*: Prints the Benchmark's information at the *Backend API*'s terminal (Pod)
- *pageLog*: Deploys a webpage that can be visited at: _https://api.`PUBLIC_IP`.nip.io/**benchmarks**_, in order to inspect the Benchmarks

Please, take into account that making any changes to the configuration described above, will not have immediate effect on the System.
The docker image of the *Backend API* needs to be rebuilt. The easiest way of achieving this is to execute:

```
./initialize.sh project_images
./initialize.sh project
```
 in order to rebuild the image and redeploy the System with the new configuration.

## The requests are being executed slower than expected. What should I do?

Maybe, your System is not powerful enough.
Please, kindly check the question:

> *The server seems that it can handle <i>more/less</i> Requests/Second. How to reduce/increase them?*

that can be found at:

> Janus/faq.md